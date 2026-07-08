/*
 * QX 的 $response.body 给的是 base64 字符串（不是 Uint8Array），
 * 所以这版多了一步 base64 ↔ bytes 的转换，其他逻辑和主版一样。
 */
(function () {
  "use strict";

  var DEFAULT_CONFIG = {
    enabled: true,
    latitude: 37.3349,
    longitude: -122.00902,
    horizontalAccuracy: 39,
    verticalAccuracy: 1000,
    altitude: 530,
    unknownValue4: 3,
    motionActivityType: 63,
    motionActivityConfidence: 467,
    failOpen: true,
    debug: false
  };

  var APPLE_WLOC_PREFIX = new Uint8Array([0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00]);
  var APPLE_WLOC_MARKER = new Uint8Array([0x00, 0x00, 0x00, 0x01, 0x00, 0x00]);
  var ROOT_DROP_FIELDS = { 3: true, 4: true, 33: true };
  var CELL_RESPONSE_FIELDS = { 22: true, 24: true };
  var LOCATION_REPLACED_FIELDS = { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 11: true, 12: true };

  // ========== Byte Utilities ==========

  function concatBytes(parts) {
    var total = 0, i;
    for (i = 0; i < parts.length; i++) total += parts[i].length;
    var out = new Uint8Array(total), offset = 0;
    for (i = 0; i < parts.length; i++) { out.set(parts[i], offset); offset += parts[i].length; }
    return out;
  }

  function findBytes(bytes, marker) {
    if (!bytes || !marker || marker.length === 0) return -1;
    for (var i = 0; i <= bytes.length - marker.length; i++) {
      var ok = true;
      for (var j = 0; j < marker.length; j++) { if (bytes[i + j] !== marker[j]) { ok = false; break; } }
      if (ok) return i;
    }
    return -1;
  }

  function hexPreview(bytes, limit) {
    if (!bytes) return "<none>";
    var out = [], max = Math.min(bytes.length, limit || 16);
    for (var i = 0; i < max; i++) out.push(("0" + bytes[i].toString(16)).slice(-2));
    return out.join("");
  }

  // ========== Base64 (QX 专用) ==========

  function base64ToBytes(b64) {
    var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var lookup = {}, i;
    for (i = 0; i < alphabet.length; i++) lookup[alphabet[i]] = i;
    b64 = b64.replace(/[^A-Za-z0-9\+\/]/g, "");
    var len = b64.length, out = [], padding = 0;
    if (len > 0 && b64[len - 1] === "=") padding++;
    if (len > 1 && b64[len - 2] === "=") padding++;
    var bufLen = (len / 4) * 3 - padding;
    var buf = new Uint8Array(bufLen), pos = 0;
    for (i = 0; i < len; i += 4) {
      var enc1 = lookup[b64[i]], enc2 = lookup[b64[i + 1]], enc3 = lookup[b64[i + 2]], enc4 = lookup[b64[i + 3]];
      var chr1 = (enc1 << 2) | (enc2 >> 4);
      var chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      var chr3 = ((enc3 & 3) << 6) | enc4;
      buf[pos++] = chr1;
      if (enc3 !== 64) buf[pos++] = chr2;
      if (enc4 !== 64) buf[pos++] = chr3;
    }
    return buf;
  }

  function bytesToBase64(bytes) {
    var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var out = "";
    for (var i = 0; i < bytes.length; i += 3) {
      var b0 = bytes[i], b1 = i + 1 < bytes.length ? bytes[i + 1] : 0, b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
      var triplet = (b0 << 16) | (b1 << 8) | b2;
      out += alphabet[(triplet >> 18) & 0x3f] + alphabet[(triplet >> 12) & 0x3f];
      out += i + 1 < bytes.length ? alphabet[(triplet >> 6) & 0x3f] : "=";
      out += i + 2 < bytes.length ? alphabet[triplet & 0x3f] : "=";
    }
    return out;
  }

  // ========== Varint / Protobuf ==========

  function encodeVarintUnsigned(value) {
    var v = typeof value === "bigint" ? value : BigInt(value);
    if (v < 0n) throw new Error("negative unsigned varint");
    var out = [];
    while (v >= 0x80n) { out.push(Number((v & 0x7fn) | 0x80n)); v >>= 7n; }
    out.push(Number(v));
    return new Uint8Array(out);
  }

  function encodeVarintSignedInt64(value) {
    var v = typeof value === "bigint" ? value : BigInt(Math.trunc(value));
    if (v < 0n) v = BigInt.asUintN(64, v);
    return encodeVarintUnsigned(v);
  }

  function decodeVarint(bytes, offset) {
    var result = 0n, shift = 0n, current = offset;
    while (current < bytes.length) {
      var b = bytes[current]; current += 1;
      result |= BigInt(b & 0x7f) << shift;
      if ((b & 0x80) === 0) return { value: result, offset: current };
      shift += 7n;
      if (shift > 70n) throw new Error("varint too long");
    }
    throw new Error("unterminated varint");
  }

  function makeKey(fieldNumber, wireType) {
    return encodeVarintUnsigned((BigInt(fieldNumber) << 3n) | BigInt(wireType));
  }

  function makeVarintField(fieldNumber, value) {
    return concatBytes([makeKey(fieldNumber, 0), encodeVarintSignedInt64(value)]);
  }

  function makeLengthDelimitedField(fieldNumber, payload) {
    return concatBytes([makeKey(fieldNumber, 2), encodeVarintUnsigned(payload.length), payload]);
  }

  function parseFields(bytes) {
    var fields = [], offset = 0;
    while (offset < bytes.length) {
      var keyStart = offset;
      var key = decodeVarint(bytes, offset);
      offset = key.offset;
      var fieldNumber = Number(key.value >> 3n), wireType = Number(key.value & 0x7n);
      if (fieldNumber === 0) throw new Error("protobuf field number 0");
      var valueStart = offset, valueEnd;
      if (wireType === 0) { valueEnd = decodeVarint(bytes, offset).offset; }
      else if (wireType === 1) { valueEnd = offset + 8; }
      else if (wireType === 2) { var lenInfo = decodeVarint(bytes, offset); valueStart = lenInfo.offset; valueEnd = valueStart + Number(lenInfo.value); }
      else if (wireType === 5) { valueEnd = offset + 4; }
      else throw new Error("unsupported wire type: " + wireType);
      if (valueEnd > bytes.length) throw new Error("field exceeds buffer");
      fields.push({ fieldNumber: fieldNumber, wireType: wireType, keyStart: keyStart, valueStart: valueStart, valueEnd: valueEnd, raw: bytes.slice(keyStart, valueEnd), valueBytes: bytes.slice(valueStart, valueEnd) });
      offset = valueEnd;
    }
    return fields;
  }

  function firstFieldByNumber(fields, fieldNumber) {
    for (var i = 0; i < fields.length; i++) { if (fields[i].fieldNumber === fieldNumber) return fields[i]; }
    return null;
  }

  function signedVarintFieldValue(field) {
    if (!field || field.wireType !== 0) return null;
    return BigInt.asIntN(64, decodeVarint(field.valueBytes, 0).value);
  }

  function tryParseFields(bytes) {
    try { if (!bytes || bytes.length === 0) return null; var f = parseFields(bytes); return f.length > 0 ? f : null; }
    catch (e) { return null; }
  }

  function isCellResponseField(fieldNumber) { return CELL_RESPONSE_FIELDS[fieldNumber] === true; }

  // ========== ARPC ==========

  function readUInt16BE(bytes, offset) { return (bytes[offset] << 8) | bytes[offset + 1]; }
  function readUInt32BE(bytes, offset) { return ((bytes[offset] * 0x1000000) + ((bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3])) >>> 0; }
  function writeUInt16BE(value) { return new Uint8Array([(value >> 8) & 0xff, value & 0xff]); }
  function writeUInt32BE(value) { return new Uint8Array([(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff]); }

  function asciiBytes(value) {
    var out = new Uint8Array(value.length);
    for (var i = 0; i < value.length; i++) out[i] = value.charCodeAt(i) & 0x7f;
    return out;
  }

  function readPascalString(bytes, state) {
    var length = readUInt16BE(bytes, state.offset); state.offset += 2;
    var chars = [];
    for (var i = 0; i < length; i++) chars.push(String.fromCharCode(bytes[state.offset + i]));
    state.offset += length;
    return chars.join("");
  }

  function writePascalString(value) { return concatBytes([writeUInt16BE(value.length), asciiBytes(value)]); }

  function parseArpc(bytes) {
    var state = { offset: 0 };
    var version = readUInt16BE(bytes, state.offset); state.offset += 2;
    var locale = readPascalString(bytes, state);
    var appIdentifier = readPascalString(bytes, state);
    var osVersion = readPascalString(bytes, state);
    var functionId = readUInt32BE(bytes, state.offset); state.offset += 4;
    var payloadLength = readUInt32BE(bytes, state.offset); state.offset += 4;
    if (state.offset + payloadLength > bytes.length) throw new Error("ARPC payload exceeds buffer");
    return { version: version, locale: locale, appIdentifier: appIdentifier, osVersion: osVersion, functionId: functionId, payload: bytes.slice(state.offset, state.offset + payloadLength) };
  }

  function serializeArpc(arpc) {
    return concatBytes([writeUInt16BE(arpc.version), writePascalString(arpc.locale), writePascalString(arpc.appIdentifier), writePascalString(arpc.osVersion), writeUInt32BE(arpc.functionId), writeUInt32BE(arpc.payload.length), arpc.payload]);
  }

  // ========== Location Patching ==========

  function coordToInt(value) { return Math.trunc(Number(value) * 100000000); }

  function patchLocation(locationPayload, config) {
    var parts = [], fields = locationPayload.length ? parseFields(locationPayload) : [];
    for (var i = 0; i < fields.length; i++) { if (!LOCATION_REPLACED_FIELDS[fields[i].fieldNumber]) parts.push(fields[i].raw); }
    parts.push(makeVarintField(1, coordToInt(config.latitude)));
    parts.push(makeVarintField(2, coordToInt(config.longitude)));
    parts.push(makeVarintField(3, config.horizontalAccuracy));
    parts.push(makeVarintField(4, config.unknownValue4));
    parts.push(makeVarintField(5, config.altitude));
    parts.push(makeVarintField(6, config.verticalAccuracy));
    parts.push(makeVarintField(11, config.motionActivityType));
    parts.push(makeVarintField(12, config.motionActivityConfidence));
    return concatBytes(parts);
  }

  function patchWifiDevice(wifiPayload, config) {
    var fields = parseFields(wifiPayload), parts = [], patchedLocation = false;
    for (var i = 0; i < fields.length; i++) {
      if (fields[i].fieldNumber === 2 && fields[i].wireType === 2) {
        parts.push(makeLengthDelimitedField(2, patchLocation(fields[i].valueBytes, config))); patchedLocation = true;
      } else parts.push(fields[i].raw);
    }
    if (!patchedLocation) parts.push(makeLengthDelimitedField(2, patchLocation(new Uint8Array([]), config)));
    return concatBytes(parts);
  }

  function patchCellTower(cellPayload, config) {
    var fields = parseFields(cellPayload), parts = [], patchedLocation = false;
    for (var i = 0; i < fields.length; i++) {
      if (fields[i].fieldNumber === 5 && fields[i].wireType === 2) {
        parts.push(makeLengthDelimitedField(5, patchLocation(fields[i].valueBytes, config))); patchedLocation = true;
      } else parts.push(fields[i].raw);
    }
    if (!patchedLocation) parts.push(makeLengthDelimitedField(5, patchLocation(new Uint8Array([]), config)));
    return concatBytes(parts);
  }

  function patchAppleWLocPayload(payload, config) {
    var fields = parseFields(payload), parts = [], wifiCount = 0, cellCount = 0;
    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      if (field.fieldNumber === 2 && field.wireType === 2) { parts.push(makeLengthDelimitedField(2, patchWifiDevice(field.valueBytes, config))); wifiCount += 1; }
      else if (isCellResponseField(field.fieldNumber) && field.wireType === 2) { parts.push(makeLengthDelimitedField(field.fieldNumber, patchCellTower(field.valueBytes, config))); cellCount += 1; }
      else if (!ROOT_DROP_FIELDS[field.fieldNumber]) parts.push(field.raw);
    }
    return { payload: concatBytes(parts), wifiCount: wifiCount, cellCount: cellCount };
  }

  // ========== Response Extraction ==========

  function extractPrefixedAppleWLocPayload(responseBytes) {
    if (!responseBytes || responseBytes.length < 10) return null;
    if (responseBytes[0] !== 0x00 || responseBytes[1] !== 0x01) return null;
    if (responseBytes[6] !== 0x00 || responseBytes[7] !== 0x00) return null;
    var payloadLength = readUInt16BE(responseBytes, 8), payloadOffset = 10;
    if (payloadLength <= 0 || payloadOffset + payloadLength > responseBytes.length) return null;
    var payload = responseBytes.slice(payloadOffset, payloadOffset + payloadLength);
    if (tryParseFields(payload) === null) return null;
    return { kind: "synthetic", payload: payload, prefix: responseBytes.slice(0, 8), suffix: responseBytes.slice(payloadOffset + payloadLength) };
  }

  function extractAppleWLocPayload(responseBytes) {
    if (!responseBytes || responseBytes.length < 2) throw new Error("Apple WLoc response too short");
    var prefixed = extractPrefixedAppleWLocPayload(responseBytes);
    if (prefixed) return prefixed;
    try {
      var arpc = parseArpc(responseBytes);
      if (arpc.payload.length > 0 && tryParseFields(arpc.payload) !== null) return { kind: "arpc", payload: arpc.payload, arpc: arpc };
    } catch (e) {}
    var markerIdx = findBytes(responseBytes, APPLE_WLOC_MARKER);
    if (markerIdx >= 0) {
      var lenOffset = markerIdx + APPLE_WLOC_MARKER.length;
      if (lenOffset + 2 <= responseBytes.length) {
        var realLen = readUInt16BE(responseBytes, lenOffset), realPayloadOffset = lenOffset + 2;
        if (realLen > 0 && realPayloadOffset + realLen <= responseBytes.length) {
          var candidatePayload = responseBytes.slice(realPayloadOffset, realPayloadOffset + realLen);
          if (tryParseFields(candidatePayload) !== null) return { kind: "marker", payload: candidatePayload, prefix: responseBytes.slice(0, markerIdx), markerAndLen: responseBytes.slice(markerIdx, realPayloadOffset), suffix: responseBytes.slice(realPayloadOffset + realLen) };
        }
      }
    }
    if (responseBytes.length > 0) { var tag = responseBytes[0]; var fn = tag >> 3, wt = tag & 0x7; if (fn > 0 && (wt === 0 || wt === 2)) return { kind: "bare", payload: responseBytes }; }
    throw new Error("missing Apple WLoc response prefix");
  }

  function buildAppleWLocResponse(payload, prefix) {
    return concatBytes([prefix || APPLE_WLOC_PREFIX, writeUInt16BE(payload.length), payload]);
  }

  function spoofAppleResponse(responseBytes, config) {
    var extraction = extractAppleWLocPayload(responseBytes);
    var patched = patchAppleWLocPayload(extraction.payload, config);
    var response;
    if (extraction.kind === "arpc") {
      response = serializeArpc({ version: extraction.arpc.version, locale: extraction.arpc.locale, appIdentifier: extraction.arpc.appIdentifier, osVersion: extraction.arpc.osVersion, functionId: extraction.arpc.functionId, payload: patched.payload });
    } else if (extraction.kind === "marker") {
      var newLenBytes = writeUInt16BE(patched.payload.length);
      response = concatBytes([extraction.prefix, extraction.markerAndLen.slice(0, APPLE_WLOC_MARKER.length), newLenBytes, patched.payload, extraction.suffix]);
    } else {
      response = buildAppleWLocResponse(patched.payload, extraction.prefix);
    }
    return { response: response, payload: patched.payload, wifiCount: patched.wifiCount, cellCount: patched.cellCount, kind: extraction.kind };
  }

  function patchedPayloadSummary(payload) {
    try {
      var rootFields = parseFields(payload), parts = [];
      var wifi = firstFieldByNumber(rootFields, 2);
      if (wifi && wifi.wireType === 2) {
        var wifiLoc = firstFieldByNumber(parseFields(wifi.valueBytes), 2);
        parts.push("firstWifi=" + (wifiLoc ? (Number(signedVarintFieldValue(firstFieldByNumber(parseFields(wifiLoc.valueBytes), 1))) / 100000000).toFixed(8) + "," + (Number(signedVarintFieldValue(firstFieldByNumber(parseFields(wifiLoc.valueBytes), 2))) / 100000000).toFixed(8) : "<missing>"));
      }
      return parts.length ? parts.join(", ") : "no location fields";
    } catch (err) { return "summary failed: " + err.message; }
  }

  // ========== Config ==========

  function normalizeConfig(input) {
    var cfg = {}, key;
    for (key in DEFAULT_CONFIG) { if (Object.prototype.hasOwnProperty.call(DEFAULT_CONFIG, key)) cfg[key] = DEFAULT_CONFIG[key]; }
    input = input || {};
    for (key in input) { if (Object.prototype.hasOwnProperty.call(input, key)) cfg[key] = input[key]; }
    cfg.enabled = cfg.enabled !== false;
    cfg.latitude = Number(cfg.latitude); cfg.longitude = Number(cfg.longitude);
    cfg.horizontalAccuracy = Math.trunc(Number(cfg.horizontalAccuracy));
    cfg.verticalAccuracy = Math.trunc(Number(cfg.verticalAccuracy));
    cfg.altitude = Math.trunc(Number(cfg.altitude));
    cfg.unknownValue4 = Math.trunc(Number(cfg.unknownValue4));
    cfg.motionActivityType = Math.trunc(Number(cfg.motionActivityType));
    cfg.motionActivityConfidence = Math.trunc(Number(cfg.motionActivityConfidence));
    cfg.failOpen = cfg.failOpen !== false;
    cfg.debug = cfg.debug === true || String(cfg.debug).toLowerCase() === "true";
    if (!Number.isFinite(cfg.latitude) || cfg.latitude < -90 || cfg.latitude > 90) throw new Error("invalid latitude");
    if (!Number.isFinite(cfg.longitude) || cfg.longitude < -180 || cfg.longitude > 180) throw new Error("invalid longitude");
    return cfg;
  }

  function loadConfig() {
    // 仅使用内置默认配置，不发起任何外部网络请求
    return normalizeConfig(DEFAULT_CONFIG);
  }

  function mergeConfig(base, extra) {
    var out = {}, key;
    for (key in base) { if (Object.prototype.hasOwnProperty.call(base, key)) out[key] = base[key]; }
    extra = extra || {};
    for (key in extra) { if (Object.prototype.hasOwnProperty.call(extra, key)) out[key] = extra[key]; }
    return out;
  }

  // ========== QX Entry Point ==========

  function runQX() {
    var hasResponse = typeof $response !== "undefined";

    if (hasResponse) {
      var config = loadConfig();
      try {
        if (!config.enabled) { $done({}); return; }
        // QX v1.0.19+ 起二进制响应走 $response.bodyBytes(ArrayBuffer)，
        // $response.body 对二进制是空/乱码文本。详见 crossutility/Quantumult-X
        // 的 sample-bytes-rewrite.js。
        var rawBuf = $response.bodyBytes;
        if (!rawBuf || (rawBuf.byteLength !== undefined && rawBuf.byteLength === 0)) {
          $done({});
          return;
        }
        var responseBytes = rawBuf instanceof Uint8Array ? rawBuf : new Uint8Array(rawBuf);
        if (responseBytes.length < 2) { $done({}); return; }
        if (config.debug) console.log("Location spoofer QX response: " + responseBytes.length + " bytes, head=" + hexPreview(responseBytes, 32));
        var result = spoofAppleResponse(responseBytes, config);
        if (config.debug) console.log("Location spoofer patched " + result.wifiCount + " wifi, " + result.cellCount + " cell, kind=" + result.kind + ", response=" + result.response.length + " bytes");
        if (config.debug) console.log("Location spoofer locations: " + patchedPayloadSummary(result.payload));
        // QX: 二进制改后响应必须用 $done({bodyBytes: ArrayBuffer}) 回写
        $done({
          bodyBytes: result.response.buffer.slice(
            result.response.byteOffset,
            result.response.byteOffset + result.response.byteLength
          )
        });
      } catch (err) {
        if (config.debug) console.log("Location spoofer failed: " + err.message);
        $done({});
      }
    } else {
      $done({});
    }
  }

  var api = {
    DEFAULT_CONFIG: DEFAULT_CONFIG,
    base64ToBytes: base64ToBytes,
    bytesToBase64: bytesToBase64,
    patchAppleWLocPayload: patchAppleWLocPayload,
    spoofAppleResponse: spoofAppleResponse,
    extractAppleWLocPayload: extractAppleWLocPayload,
    parseArpc: parseArpc,
    coordToInt: coordToInt
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    runQX();
  }
}());
