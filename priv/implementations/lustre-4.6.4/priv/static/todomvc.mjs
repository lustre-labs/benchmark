// build/dev/javascript/prelude.mjs
var CustomType = class {
  withFields(fields) {
    let properties = Object.keys(this).map(
      (label2) => label2 in fields ? fields[label2] : this[label2]
    );
    return new this.constructor(...properties);
  }
};
var List = class {
  static fromArray(array4, tail) {
    let t = tail || new Empty();
    for (let i = array4.length - 1; i >= 0; --i) {
      t = new NonEmpty(array4[i], t);
    }
    return t;
  }
  [Symbol.iterator]() {
    return new ListIterator(this);
  }
  toArray() {
    return [...this];
  }
  // @internal
  atLeastLength(desired) {
    let current = this;
    while (desired-- > 0 && current) current = current.tail;
    return current !== void 0;
  }
  // @internal
  hasLength(desired) {
    let current = this;
    while (desired-- > 0 && current) current = current.tail;
    return desired === -1 && current instanceof Empty;
  }
  // @internal
  countLength() {
    let current = this;
    let length3 = 0;
    while (current) {
      current = current.tail;
      length3++;
    }
    return length3 - 1;
  }
};
function prepend(element2, tail) {
  return new NonEmpty(element2, tail);
}
function toList(elements2, tail) {
  return List.fromArray(elements2, tail);
}
var ListIterator = class {
  #current;
  constructor(current) {
    this.#current = current;
  }
  next() {
    if (this.#current instanceof Empty) {
      return { done: true };
    } else {
      let { head, tail } = this.#current;
      this.#current = tail;
      return { value: head, done: false };
    }
  }
};
var Empty = class extends List {
};
var NonEmpty = class extends List {
  constructor(head, tail) {
    super();
    this.head = head;
    this.tail = tail;
  }
};
var BitArray = class {
  /**
   * The size in bits of this bit array's data.
   *
   * @type {number}
   */
  bitSize;
  /**
   * The size in bytes of this bit array's data. If this bit array doesn't store
   * a whole number of bytes then this value is rounded up.
   *
   * @type {number}
   */
  byteSize;
  /**
   * The number of unused high bits in the first byte of this bit array's
   * buffer prior to the start of its data. The value of any unused high bits is
   * undefined.
   *
   * The bit offset will be in the range 0-7.
   *
   * @type {number}
   */
  bitOffset;
  /**
   * The raw bytes that hold this bit array's data.
   *
   * If `bitOffset` is not zero then there are unused high bits in the first
   * byte of this buffer.
   *
   * If `bitOffset + bitSize` is not a multiple of 8 then there are unused low
   * bits in the last byte of this buffer.
   *
   * @type {Uint8Array}
   */
  rawBuffer;
  /**
   * Constructs a new bit array from a `Uint8Array`, an optional size in
   * bits, and an optional bit offset.
   *
   * If no bit size is specified it is taken as `buffer.length * 8`, i.e. all
   * bytes in the buffer make up the new bit array's data.
   *
   * If no bit offset is specified it defaults to zero, i.e. there are no unused
   * high bits in the first byte of the buffer.
   *
   * @param {Uint8Array} buffer
   * @param {number} [bitSize]
   * @param {number} [bitOffset]
   */
  constructor(buffer, bitSize, bitOffset) {
    if (!(buffer instanceof Uint8Array)) {
      throw globalThis.Error(
        "BitArray can only be constructed from a Uint8Array"
      );
    }
    this.bitSize = bitSize ?? buffer.length * 8;
    this.byteSize = Math.trunc((this.bitSize + 7) / 8);
    this.bitOffset = bitOffset ?? 0;
    if (this.bitSize < 0) {
      throw globalThis.Error(`BitArray bit size is invalid: ${this.bitSize}`);
    }
    if (this.bitOffset < 0 || this.bitOffset > 7) {
      throw globalThis.Error(
        `BitArray bit offset is invalid: ${this.bitOffset}`
      );
    }
    if (buffer.length !== Math.trunc((this.bitOffset + this.bitSize + 7) / 8)) {
      throw globalThis.Error("BitArray buffer length is invalid");
    }
    this.rawBuffer = buffer;
  }
  /**
   * Returns a specific byte in this bit array. If the byte index is out of
   * range then `undefined` is returned.
   *
   * When returning the final byte of a bit array with a bit size that's not a
   * multiple of 8, the content of the unused low bits are undefined.
   *
   * @param {number} index
   * @returns {number | undefined}
   */
  byteAt(index3) {
    if (index3 < 0 || index3 >= this.byteSize) {
      return void 0;
    }
    return bitArrayByteAt(this.rawBuffer, this.bitOffset, index3);
  }
  /** @internal */
  equals(other) {
    if (this.bitSize !== other.bitSize) {
      return false;
    }
    const wholeByteCount = Math.trunc(this.bitSize / 8);
    if (this.bitOffset === 0 && other.bitOffset === 0) {
      for (let i = 0; i < wholeByteCount; i++) {
        if (this.rawBuffer[i] !== other.rawBuffer[i]) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (this.rawBuffer[wholeByteCount] >> unusedLowBitCount !== other.rawBuffer[wholeByteCount] >> unusedLowBitCount) {
          return false;
        }
      }
    } else {
      for (let i = 0; i < wholeByteCount; i++) {
        const a2 = bitArrayByteAt(this.rawBuffer, this.bitOffset, i);
        const b = bitArrayByteAt(other.rawBuffer, other.bitOffset, i);
        if (a2 !== b) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const a2 = bitArrayByteAt(
          this.rawBuffer,
          this.bitOffset,
          wholeByteCount
        );
        const b = bitArrayByteAt(
          other.rawBuffer,
          other.bitOffset,
          wholeByteCount
        );
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (a2 >> unusedLowBitCount !== b >> unusedLowBitCount) {
          return false;
        }
      }
    }
    return true;
  }
  /**
   * Returns this bit array's internal buffer.
   *
   * @deprecated Use `BitArray.byteAt()` or `BitArray.rawBuffer` instead.
   *
   * @returns {Uint8Array}
   */
  get buffer() {
    bitArrayPrintDeprecationWarning(
      "buffer",
      "Use BitArray.byteAt() or BitArray.rawBuffer instead"
    );
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error(
        "BitArray.buffer does not support unaligned bit arrays"
      );
    }
    return this.rawBuffer;
  }
  /**
   * Returns the length in bytes of this bit array's internal buffer.
   *
   * @deprecated Use `BitArray.bitSize` or `BitArray.byteSize` instead.
   *
   * @returns {number}
   */
  get length() {
    bitArrayPrintDeprecationWarning(
      "length",
      "Use BitArray.bitSize or BitArray.byteSize instead"
    );
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error(
        "BitArray.length does not support unaligned bit arrays"
      );
    }
    return this.rawBuffer.length;
  }
};
function bitArrayByteAt(buffer, bitOffset, index3) {
  if (bitOffset === 0) {
    return buffer[index3] ?? 0;
  } else {
    const a2 = buffer[index3] << bitOffset & 255;
    const b = buffer[index3 + 1] >> 8 - bitOffset;
    return a2 | b;
  }
}
var isBitArrayDeprecationMessagePrinted = {};
function bitArrayPrintDeprecationWarning(name, message) {
  if (isBitArrayDeprecationMessagePrinted[name]) {
    return;
  }
  console.warn(
    `Deprecated BitArray.${name} property used in JavaScript FFI code. ${message}.`
  );
  isBitArrayDeprecationMessagePrinted[name] = true;
}
var Result = class _Result extends CustomType {
  // @internal
  static isResult(data) {
    return data instanceof _Result;
  }
};
var Ok = class extends Result {
  constructor(value3) {
    super();
    this[0] = value3;
  }
  // @internal
  isOk() {
    return true;
  }
};
var Error = class extends Result {
  constructor(detail) {
    super();
    this[0] = detail;
  }
  // @internal
  isOk() {
    return false;
  }
};
function isEqual(x, y) {
  let values2 = [x, y];
  while (values2.length) {
    let a2 = values2.pop();
    let b = values2.pop();
    if (a2 === b) continue;
    if (!isObject(a2) || !isObject(b)) return false;
    let unequal = !structurallyCompatibleObjects(a2, b) || unequalDates(a2, b) || unequalBuffers(a2, b) || unequalArrays(a2, b) || unequalMaps(a2, b) || unequalSets(a2, b) || unequalRegExps(a2, b);
    if (unequal) return false;
    const proto = Object.getPrototypeOf(a2);
    if (proto !== null && typeof proto.equals === "function") {
      try {
        if (a2.equals(b)) continue;
        else return false;
      } catch {
      }
    }
    let [keys2, get3] = getters(a2);
    for (let k of keys2(a2)) {
      values2.push(get3(a2, k), get3(b, k));
    }
  }
  return true;
}
function getters(object3) {
  if (object3 instanceof Map) {
    return [(x) => x.keys(), (x, y) => x.get(y)];
  } else {
    let extra = object3 instanceof globalThis.Error ? ["message"] : [];
    return [(x) => [...extra, ...Object.keys(x)], (x, y) => x[y]];
  }
}
function unequalDates(a2, b) {
  return a2 instanceof Date && (a2 > b || a2 < b);
}
function unequalBuffers(a2, b) {
  return !(a2 instanceof BitArray) && a2.buffer instanceof ArrayBuffer && a2.BYTES_PER_ELEMENT && !(a2.byteLength === b.byteLength && a2.every((n, i) => n === b[i]));
}
function unequalArrays(a2, b) {
  return Array.isArray(a2) && a2.length !== b.length;
}
function unequalMaps(a2, b) {
  return a2 instanceof Map && a2.size !== b.size;
}
function unequalSets(a2, b) {
  return a2 instanceof Set && (a2.size != b.size || [...a2].some((e) => !b.has(e)));
}
function unequalRegExps(a2, b) {
  return a2 instanceof RegExp && (a2.source !== b.source || a2.flags !== b.flags);
}
function isObject(a2) {
  return typeof a2 === "object" && a2 !== null;
}
function structurallyCompatibleObjects(a2, b) {
  if (typeof a2 !== "object" && typeof b !== "object" && (!a2 || !b))
    return false;
  let nonstructural = [Promise, WeakSet, WeakMap, Function];
  if (nonstructural.some((c) => a2 instanceof c)) return false;
  return a2.constructor === b.constructor;
}
function makeError(variant, module, line, fn, message, extra) {
  let error = new globalThis.Error(message);
  error.gleam_error = variant;
  error.module = module;
  error.line = line;
  error.function = fn;
  error.fn = fn;
  for (let k in extra) error[k] = extra[k];
  return error;
}

// build/dev/javascript/gleam_stdlib/gleam/option.mjs
var Some = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var None = class extends CustomType {
};
function to_result(option, e) {
  if (option instanceof Some) {
    let a2 = option[0];
    return new Ok(a2);
  } else {
    return new Error(e);
  }
}

// build/dev/javascript/gleam_stdlib/gleam/dict.mjs
function insert(dict2, key, value3) {
  return map_insert(key, value3, dict2);
}
function reverse_and_concat(loop$remaining, loop$accumulator) {
  while (true) {
    let remaining = loop$remaining;
    let accumulator = loop$accumulator;
    if (remaining.hasLength(0)) {
      return accumulator;
    } else {
      let first2 = remaining.head;
      let rest = remaining.tail;
      loop$remaining = rest;
      loop$accumulator = prepend(first2, accumulator);
    }
  }
}
function do_keys_loop(loop$list, loop$acc) {
  while (true) {
    let list2 = loop$list;
    let acc = loop$acc;
    if (list2.hasLength(0)) {
      return reverse_and_concat(acc, toList([]));
    } else {
      let key = list2.head[0];
      let rest = list2.tail;
      loop$list = rest;
      loop$acc = prepend(key, acc);
    }
  }
}
function keys(dict2) {
  return do_keys_loop(map_to_list(dict2), toList([]));
}

// build/dev/javascript/gleam_stdlib/gleam/list.mjs
function reverse_and_prepend(loop$prefix, loop$suffix) {
  while (true) {
    let prefix = loop$prefix;
    let suffix = loop$suffix;
    if (prefix.hasLength(0)) {
      return suffix;
    } else {
      let first$1 = prefix.head;
      let rest$1 = prefix.tail;
      loop$prefix = rest$1;
      loop$suffix = prepend(first$1, suffix);
    }
  }
}
function reverse(list2) {
  return reverse_and_prepend(list2, toList([]));
}
function filter_map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list2 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list2.hasLength(0)) {
      return reverse(acc);
    } else {
      let first$1 = list2.head;
      let rest$1 = list2.tail;
      let new_acc = (() => {
        let $ = fun(first$1);
        if ($.isOk()) {
          let first$2 = $[0];
          return prepend(first$2, acc);
        } else {
          return acc;
        }
      })();
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = new_acc;
    }
  }
}
function filter_map(list2, fun) {
  return filter_map_loop(list2, fun, toList([]));
}
function map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list2 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list2.hasLength(0)) {
      return reverse(acc);
    } else {
      let first$1 = list2.head;
      let rest$1 = list2.tail;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = prepend(fun(first$1), acc);
    }
  }
}
function map(list2, fun) {
  return map_loop(list2, fun, toList([]));
}
function fold(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list2 = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list2.hasLength(0)) {
      return initial;
    } else {
      let first$1 = list2.head;
      let rest$1 = list2.tail;
      loop$list = rest$1;
      loop$initial = fun(initial, first$1);
      loop$fun = fun;
    }
  }
}
function index_fold_loop(loop$over, loop$acc, loop$with, loop$index) {
  while (true) {
    let over = loop$over;
    let acc = loop$acc;
    let with$ = loop$with;
    let index3 = loop$index;
    if (over.hasLength(0)) {
      return acc;
    } else {
      let first$1 = over.head;
      let rest$1 = over.tail;
      loop$over = rest$1;
      loop$acc = with$(acc, first$1, index3);
      loop$with = with$;
      loop$index = index3 + 1;
    }
  }
}
function index_fold(list2, initial, fun) {
  return index_fold_loop(list2, initial, fun, 0);
}

// build/dev/javascript/gleam_stdlib/gleam/result.mjs
function map2(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(fun(x));
  } else {
    let e = result[0];
    return new Error(e);
  }
}
function map_error(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(x);
  } else {
    let error = result[0];
    return new Error(fun(error));
  }
}
function try$(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return fun(x);
  } else {
    let e = result[0];
    return new Error(e);
  }
}

// build/dev/javascript/gleam_stdlib/gleam/dynamic.mjs
var DecodeError = class extends CustomType {
  constructor(expected, found, path) {
    super();
    this.expected = expected;
    this.found = found;
    this.path = path;
  }
};
function map_errors(result, f) {
  return map_error(
    result,
    (_capture) => {
      return map(_capture, f);
    }
  );
}
function string(data) {
  return decode_string(data);
}
function int(data) {
  return decode_int(data);
}
function bool(data) {
  return decode_bool(data);
}
function do_any(decoders) {
  return (data) => {
    if (decoders.hasLength(0)) {
      return new Error(
        toList([new DecodeError("another type", classify_dynamic(data), toList([]))])
      );
    } else {
      let decoder = decoders.head;
      let decoders$1 = decoders.tail;
      let $ = decoder(data);
      if ($.isOk()) {
        let decoded = $[0];
        return new Ok(decoded);
      } else {
        return do_any(decoders$1)(data);
      }
    }
  };
}
function push_path(error, name) {
  let name$1 = identity(name);
  let decoder = do_any(
    toList([
      decode_string,
      (x) => {
        return map2(decode_int(x), to_string);
      }
    ])
  );
  let name$2 = (() => {
    let $ = decoder(name$1);
    if ($.isOk()) {
      let name$22 = $[0];
      return name$22;
    } else {
      let _pipe = toList(["<", classify_dynamic(name$1), ">"]);
      let _pipe$1 = concat(_pipe);
      return identity(_pipe$1);
    }
  })();
  let _record = error;
  return new DecodeError(
    _record.expected,
    _record.found,
    prepend(name$2, error.path)
  );
}
function field(name, inner_type) {
  return (value3) => {
    let missing_field_error = new DecodeError("field", "nothing", toList([]));
    return try$(
      decode_field(value3, name),
      (maybe_inner) => {
        let _pipe = maybe_inner;
        let _pipe$1 = to_result(_pipe, toList([missing_field_error]));
        let _pipe$2 = try$(_pipe$1, inner_type);
        return map_errors(
          _pipe$2,
          (_capture) => {
            return push_path(_capture, name);
          }
        );
      }
    );
  };
}

// build/dev/javascript/gleam_stdlib/dict.mjs
var referenceMap = /* @__PURE__ */ new WeakMap();
var tempDataView = /* @__PURE__ */ new DataView(
  /* @__PURE__ */ new ArrayBuffer(8)
);
var referenceUID = 0;
function hashByReference(o) {
  const known = referenceMap.get(o);
  if (known !== void 0) {
    return known;
  }
  const hash = referenceUID++;
  if (referenceUID === 2147483647) {
    referenceUID = 0;
  }
  referenceMap.set(o, hash);
  return hash;
}
function hashMerge(a2, b) {
  return a2 ^ b + 2654435769 + (a2 << 6) + (a2 >> 2) | 0;
}
function hashString(s) {
  let hash = 0;
  const len = s.length;
  for (let i = 0; i < len; i++) {
    hash = Math.imul(31, hash) + s.charCodeAt(i) | 0;
  }
  return hash;
}
function hashNumber(n) {
  tempDataView.setFloat64(0, n);
  const i = tempDataView.getInt32(0);
  const j = tempDataView.getInt32(4);
  return Math.imul(73244475, i >> 16 ^ i) ^ j;
}
function hashBigInt(n) {
  return hashString(n.toString());
}
function hashObject(o) {
  const proto = Object.getPrototypeOf(o);
  if (proto !== null && typeof proto.hashCode === "function") {
    try {
      const code = o.hashCode(o);
      if (typeof code === "number") {
        return code;
      }
    } catch {
    }
  }
  if (o instanceof Promise || o instanceof WeakSet || o instanceof WeakMap) {
    return hashByReference(o);
  }
  if (o instanceof Date) {
    return hashNumber(o.getTime());
  }
  let h = 0;
  if (o instanceof ArrayBuffer) {
    o = new Uint8Array(o);
  }
  if (Array.isArray(o) || o instanceof Uint8Array) {
    for (let i = 0; i < o.length; i++) {
      h = Math.imul(31, h) + getHash(o[i]) | 0;
    }
  } else if (o instanceof Set) {
    o.forEach((v) => {
      h = h + getHash(v) | 0;
    });
  } else if (o instanceof Map) {
    o.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
  } else {
    const keys2 = Object.keys(o);
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      const v = o[k];
      h = h + hashMerge(getHash(v), hashString(k)) | 0;
    }
  }
  return h;
}
function getHash(u) {
  if (u === null) return 1108378658;
  if (u === void 0) return 1108378659;
  if (u === true) return 1108378657;
  if (u === false) return 1108378656;
  switch (typeof u) {
    case "number":
      return hashNumber(u);
    case "string":
      return hashString(u);
    case "bigint":
      return hashBigInt(u);
    case "object":
      return hashObject(u);
    case "symbol":
      return hashByReference(u);
    case "function":
      return hashByReference(u);
    default:
      return 0;
  }
}
var SHIFT = 5;
var BUCKET_SIZE = Math.pow(2, SHIFT);
var MASK = BUCKET_SIZE - 1;
var MAX_INDEX_NODE = BUCKET_SIZE / 2;
var MIN_ARRAY_NODE = BUCKET_SIZE / 4;
var ENTRY = 0;
var ARRAY_NODE = 1;
var INDEX_NODE = 2;
var COLLISION_NODE = 3;
var EMPTY = {
  type: INDEX_NODE,
  bitmap: 0,
  array: []
};
function mask(hash, shift) {
  return hash >>> shift & MASK;
}
function bitpos(hash, shift) {
  return 1 << mask(hash, shift);
}
function bitcount(x) {
  x -= x >> 1 & 1431655765;
  x = (x & 858993459) + (x >> 2 & 858993459);
  x = x + (x >> 4) & 252645135;
  x += x >> 8;
  x += x >> 16;
  return x & 127;
}
function index(bitmap, bit) {
  return bitcount(bitmap & bit - 1);
}
function cloneAndSet(arr, at, val) {
  const len = arr.length;
  const out = new Array(len);
  for (let i = 0; i < len; ++i) {
    out[i] = arr[i];
  }
  out[at] = val;
  return out;
}
function spliceIn(arr, at, val) {
  const len = arr.length;
  const out = new Array(len + 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  out[g++] = val;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function spliceOut(arr, at) {
  const len = arr.length;
  const out = new Array(len - 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  ++i;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function createNode(shift, key1, val1, key2hash, key2, val2) {
  const key1hash = getHash(key1);
  if (key1hash === key2hash) {
    return {
      type: COLLISION_NODE,
      hash: key1hash,
      array: [
        { type: ENTRY, k: key1, v: val1 },
        { type: ENTRY, k: key2, v: val2 }
      ]
    };
  }
  const addedLeaf = { val: false };
  return assoc(
    assocIndex(EMPTY, shift, key1hash, key1, val1, addedLeaf),
    shift,
    key2hash,
    key2,
    val2,
    addedLeaf
  );
}
function assoc(root, shift, hash, key, val, addedLeaf) {
  switch (root.type) {
    case ARRAY_NODE:
      return assocArray(root, shift, hash, key, val, addedLeaf);
    case INDEX_NODE:
      return assocIndex(root, shift, hash, key, val, addedLeaf);
    case COLLISION_NODE:
      return assocCollision(root, shift, hash, key, val, addedLeaf);
  }
}
function assocArray(root, shift, hash, key, val, addedLeaf) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root.size + 1,
      array: cloneAndSet(root.array, idx, { type: ENTRY, k: key, v: val })
    };
  }
  if (node.type === ENTRY) {
    if (isEqual(key, node.k)) {
      if (val === node.v) {
        return root;
      }
      return {
        type: ARRAY_NODE,
        size: root.size,
        array: cloneAndSet(root.array, idx, {
          type: ENTRY,
          k: key,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root.size,
      array: cloneAndSet(
        root.array,
        idx,
        createNode(shift + SHIFT, node.k, node.v, hash, key, val)
      )
    };
  }
  const n = assoc(node, shift + SHIFT, hash, key, val, addedLeaf);
  if (n === node) {
    return root;
  }
  return {
    type: ARRAY_NODE,
    size: root.size,
    array: cloneAndSet(root.array, idx, n)
  };
}
function assocIndex(root, shift, hash, key, val, addedLeaf) {
  const bit = bitpos(hash, shift);
  const idx = index(root.bitmap, bit);
  if ((root.bitmap & bit) !== 0) {
    const node = root.array[idx];
    if (node.type !== ENTRY) {
      const n = assoc(node, shift + SHIFT, hash, key, val, addedLeaf);
      if (n === node) {
        return root;
      }
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, n)
      };
    }
    const nodeKey = node.k;
    if (isEqual(key, nodeKey)) {
      if (val === node.v) {
        return root;
      }
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, {
          type: ENTRY,
          k: key,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap,
      array: cloneAndSet(
        root.array,
        idx,
        createNode(shift + SHIFT, nodeKey, node.v, hash, key, val)
      )
    };
  } else {
    const n = root.array.length;
    if (n >= MAX_INDEX_NODE) {
      const nodes = new Array(32);
      const jdx = mask(hash, shift);
      nodes[jdx] = assocIndex(EMPTY, shift + SHIFT, hash, key, val, addedLeaf);
      let j = 0;
      let bitmap = root.bitmap;
      for (let i = 0; i < 32; i++) {
        if ((bitmap & 1) !== 0) {
          const node = root.array[j++];
          nodes[i] = node;
        }
        bitmap = bitmap >>> 1;
      }
      return {
        type: ARRAY_NODE,
        size: n + 1,
        array: nodes
      };
    } else {
      const newArray = spliceIn(root.array, idx, {
        type: ENTRY,
        k: key,
        v: val
      });
      addedLeaf.val = true;
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap | bit,
        array: newArray
      };
    }
  }
}
function assocCollision(root, shift, hash, key, val, addedLeaf) {
  if (hash === root.hash) {
    const idx = collisionIndexOf(root, key);
    if (idx !== -1) {
      const entry = root.array[idx];
      if (entry.v === val) {
        return root;
      }
      return {
        type: COLLISION_NODE,
        hash,
        array: cloneAndSet(root.array, idx, { type: ENTRY, k: key, v: val })
      };
    }
    const size2 = root.array.length;
    addedLeaf.val = true;
    return {
      type: COLLISION_NODE,
      hash,
      array: cloneAndSet(root.array, size2, { type: ENTRY, k: key, v: val })
    };
  }
  return assoc(
    {
      type: INDEX_NODE,
      bitmap: bitpos(root.hash, shift),
      array: [root]
    },
    shift,
    hash,
    key,
    val,
    addedLeaf
  );
}
function collisionIndexOf(root, key) {
  const size2 = root.array.length;
  for (let i = 0; i < size2; i++) {
    if (isEqual(key, root.array[i].k)) {
      return i;
    }
  }
  return -1;
}
function find(root, shift, hash, key) {
  switch (root.type) {
    case ARRAY_NODE:
      return findArray(root, shift, hash, key);
    case INDEX_NODE:
      return findIndex(root, shift, hash, key);
    case COLLISION_NODE:
      return findCollision(root, key);
  }
}
function findArray(root, shift, hash, key) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    return void 0;
  }
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key);
  }
  if (isEqual(key, node.k)) {
    return node;
  }
  return void 0;
}
function findIndex(root, shift, hash, key) {
  const bit = bitpos(hash, shift);
  if ((root.bitmap & bit) === 0) {
    return void 0;
  }
  const idx = index(root.bitmap, bit);
  const node = root.array[idx];
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key);
  }
  if (isEqual(key, node.k)) {
    return node;
  }
  return void 0;
}
function findCollision(root, key) {
  const idx = collisionIndexOf(root, key);
  if (idx < 0) {
    return void 0;
  }
  return root.array[idx];
}
function without(root, shift, hash, key) {
  switch (root.type) {
    case ARRAY_NODE:
      return withoutArray(root, shift, hash, key);
    case INDEX_NODE:
      return withoutIndex(root, shift, hash, key);
    case COLLISION_NODE:
      return withoutCollision(root, key);
  }
}
function withoutArray(root, shift, hash, key) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    return root;
  }
  let n = void 0;
  if (node.type === ENTRY) {
    if (!isEqual(node.k, key)) {
      return root;
    }
  } else {
    n = without(node, shift + SHIFT, hash, key);
    if (n === node) {
      return root;
    }
  }
  if (n === void 0) {
    if (root.size <= MIN_ARRAY_NODE) {
      const arr = root.array;
      const out = new Array(root.size - 1);
      let i = 0;
      let j = 0;
      let bitmap = 0;
      while (i < idx) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      ++i;
      while (i < arr.length) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      return {
        type: INDEX_NODE,
        bitmap,
        array: out
      };
    }
    return {
      type: ARRAY_NODE,
      size: root.size - 1,
      array: cloneAndSet(root.array, idx, n)
    };
  }
  return {
    type: ARRAY_NODE,
    size: root.size,
    array: cloneAndSet(root.array, idx, n)
  };
}
function withoutIndex(root, shift, hash, key) {
  const bit = bitpos(hash, shift);
  if ((root.bitmap & bit) === 0) {
    return root;
  }
  const idx = index(root.bitmap, bit);
  const node = root.array[idx];
  if (node.type !== ENTRY) {
    const n = without(node, shift + SHIFT, hash, key);
    if (n === node) {
      return root;
    }
    if (n !== void 0) {
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, n)
      };
    }
    if (root.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap ^ bit,
      array: spliceOut(root.array, idx)
    };
  }
  if (isEqual(key, node.k)) {
    if (root.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap ^ bit,
      array: spliceOut(root.array, idx)
    };
  }
  return root;
}
function withoutCollision(root, key) {
  const idx = collisionIndexOf(root, key);
  if (idx < 0) {
    return root;
  }
  if (root.array.length === 1) {
    return void 0;
  }
  return {
    type: COLLISION_NODE,
    hash: root.hash,
    array: spliceOut(root.array, idx)
  };
}
function forEach(root, fn) {
  if (root === void 0) {
    return;
  }
  const items = root.array;
  const size2 = items.length;
  for (let i = 0; i < size2; i++) {
    const item = items[i];
    if (item === void 0) {
      continue;
    }
    if (item.type === ENTRY) {
      fn(item.v, item.k);
      continue;
    }
    forEach(item, fn);
  }
}
var Dict = class _Dict {
  /**
   * @template V
   * @param {Record<string,V>} o
   * @returns {Dict<string,V>}
   */
  static fromObject(o) {
    const keys2 = Object.keys(o);
    let m = _Dict.new();
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      m = m.set(k, o[k]);
    }
    return m;
  }
  /**
   * @template K,V
   * @param {Map<K,V>} o
   * @returns {Dict<K,V>}
   */
  static fromMap(o) {
    let m = _Dict.new();
    o.forEach((v, k) => {
      m = m.set(k, v);
    });
    return m;
  }
  static new() {
    return new _Dict(void 0, 0);
  }
  /**
   * @param {undefined | Node<K,V>} root
   * @param {number} size
   */
  constructor(root, size2) {
    this.root = root;
    this.size = size2;
  }
  /**
   * @template NotFound
   * @param {K} key
   * @param {NotFound} notFound
   * @returns {NotFound | V}
   */
  get(key, notFound) {
    if (this.root === void 0) {
      return notFound;
    }
    const found = find(this.root, 0, getHash(key), key);
    if (found === void 0) {
      return notFound;
    }
    return found.v;
  }
  /**
   * @param {K} key
   * @param {V} val
   * @returns {Dict<K,V>}
   */
  set(key, val) {
    const addedLeaf = { val: false };
    const root = this.root === void 0 ? EMPTY : this.root;
    const newRoot = assoc(root, 0, getHash(key), key, val, addedLeaf);
    if (newRoot === this.root) {
      return this;
    }
    return new _Dict(newRoot, addedLeaf.val ? this.size + 1 : this.size);
  }
  /**
   * @param {K} key
   * @returns {Dict<K,V>}
   */
  delete(key) {
    if (this.root === void 0) {
      return this;
    }
    const newRoot = without(this.root, 0, getHash(key), key);
    if (newRoot === this.root) {
      return this;
    }
    if (newRoot === void 0) {
      return _Dict.new();
    }
    return new _Dict(newRoot, this.size - 1);
  }
  /**
   * @param {K} key
   * @returns {boolean}
   */
  has(key) {
    if (this.root === void 0) {
      return false;
    }
    return find(this.root, 0, getHash(key), key) !== void 0;
  }
  /**
   * @returns {[K,V][]}
   */
  entries() {
    if (this.root === void 0) {
      return [];
    }
    const result = [];
    this.forEach((v, k) => result.push([k, v]));
    return result;
  }
  /**
   *
   * @param {(val:V,key:K)=>void} fn
   */
  forEach(fn) {
    forEach(this.root, fn);
  }
  hashCode() {
    let h = 0;
    this.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
    return h;
  }
  /**
   * @param {unknown} o
   * @returns {boolean}
   */
  equals(o) {
    if (!(o instanceof _Dict) || this.size !== o.size) {
      return false;
    }
    try {
      this.forEach((v, k) => {
        if (!isEqual(o.get(k, !v), v)) {
          throw unequalDictSymbol;
        }
      });
      return true;
    } catch (e) {
      if (e === unequalDictSymbol) {
        return false;
      }
      throw e;
    }
  }
};
var unequalDictSymbol = /* @__PURE__ */ Symbol();

// build/dev/javascript/gleam_stdlib/gleam_stdlib.mjs
var Nil = void 0;
var NOT_FOUND = {};
function identity(x) {
  return x;
}
function to_string(term) {
  return term.toString();
}
var segmenter = void 0;
function graphemes_iterator(string4) {
  if (globalThis.Intl && Intl.Segmenter) {
    segmenter ||= new Intl.Segmenter();
    return segmenter.segment(string4)[Symbol.iterator]();
  }
}
function pop_grapheme(string4) {
  let first2;
  const iterator = graphemes_iterator(string4);
  if (iterator) {
    first2 = iterator.next().value?.segment;
  } else {
    first2 = string4.match(/./su)?.[0];
  }
  if (first2) {
    return new Ok([first2, string4.slice(first2.length)]);
  } else {
    return new Error(Nil);
  }
}
function join(xs, separator) {
  const iterator = xs[Symbol.iterator]();
  let result = iterator.next().value || "";
  let current = iterator.next();
  while (!current.done) {
    result = result + separator + current.value;
    current = iterator.next();
  }
  return result;
}
function concat(xs) {
  let result = "";
  for (const x of xs) {
    result = result + x;
  }
  return result;
}
var unicode_whitespaces = [
  " ",
  // Space
  "	",
  // Horizontal tab
  "\n",
  // Line feed
  "\v",
  // Vertical tab
  "\f",
  // Form feed
  "\r",
  // Carriage return
  "\x85",
  // Next line
  "\u2028",
  // Line separator
  "\u2029"
  // Paragraph separator
].join("");
var trim_start_regex = /* @__PURE__ */ new RegExp(
  `^[${unicode_whitespaces}]*`
);
var trim_end_regex = /* @__PURE__ */ new RegExp(`[${unicode_whitespaces}]*$`);
function trim_start(string4) {
  return string4.replace(trim_start_regex, "");
}
function trim_end(string4) {
  return string4.replace(trim_end_regex, "");
}
function new_map() {
  return Dict.new();
}
function map_to_list(map7) {
  return List.fromArray(map7.entries());
}
function map_get(map7, key) {
  const value3 = map7.get(key, NOT_FOUND);
  if (value3 === NOT_FOUND) {
    return new Error(Nil);
  }
  return new Ok(value3);
}
function map_insert(key, value3, map7) {
  return map7.set(key, value3);
}
function classify_dynamic(data) {
  if (typeof data === "string") {
    return "String";
  } else if (typeof data === "boolean") {
    return "Bool";
  } else if (data instanceof Result) {
    return "Result";
  } else if (data instanceof List) {
    return "List";
  } else if (data instanceof BitArray) {
    return "BitArray";
  } else if (data instanceof Dict) {
    return "Dict";
  } else if (Number.isInteger(data)) {
    return "Int";
  } else if (Array.isArray(data)) {
    return `Tuple of ${data.length} elements`;
  } else if (typeof data === "number") {
    return "Float";
  } else if (data === null) {
    return "Null";
  } else if (data === void 0) {
    return "Nil";
  } else {
    const type = typeof data;
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
}
function decoder_error(expected, got) {
  return decoder_error_no_classify(expected, classify_dynamic(got));
}
function decoder_error_no_classify(expected, got) {
  return new Error(
    List.fromArray([new DecodeError(expected, got, List.fromArray([]))])
  );
}
function decode_string(data) {
  return typeof data === "string" ? new Ok(data) : decoder_error("String", data);
}
function decode_int(data) {
  return Number.isInteger(data) ? new Ok(data) : decoder_error("Int", data);
}
function decode_bool(data) {
  return typeof data === "boolean" ? new Ok(data) : decoder_error("Bool", data);
}
function decode_field(value3, name) {
  const not_a_map_error = () => decoder_error("Dict", value3);
  if (value3 instanceof Dict || value3 instanceof WeakMap || value3 instanceof Map) {
    const entry = map_get(value3, name);
    return new Ok(entry.isOk() ? new Some(entry[0]) : new None());
  } else if (value3 === null) {
    return not_a_map_error();
  } else if (Object.getPrototypeOf(value3) == Object.prototype) {
    return try_get_field(value3, name, () => new Ok(new None()));
  } else {
    return try_get_field(value3, name, not_a_map_error);
  }
}
function try_get_field(value3, field2, or_else) {
  try {
    return field2 in value3 ? new Ok(new Some(value3[field2])) : or_else();
  } catch {
    return or_else();
  }
}

// build/dev/javascript/gleam_stdlib/gleam/string.mjs
function trim(string4) {
  let _pipe = string4;
  let _pipe$1 = trim_start(_pipe);
  return trim_end(_pipe$1);
}
function drop_start(loop$string, loop$num_graphemes) {
  while (true) {
    let string4 = loop$string;
    let num_graphemes = loop$num_graphemes;
    let $ = num_graphemes > 0;
    if (!$) {
      return string4;
    } else {
      let $1 = pop_grapheme(string4);
      if ($1.isOk()) {
        let string$1 = $1[0][1];
        loop$string = string$1;
        loop$num_graphemes = num_graphemes - 1;
      } else {
        return string4;
      }
    }
  }
}

// build/dev/javascript/gleam_json/gleam_json_ffi.mjs
function identity2(x) {
  return x;
}

// build/dev/javascript/gleam_json/gleam/json.mjs
function bool2(input2) {
  return identity2(input2);
}

// build/dev/javascript/gleam_stdlib/gleam/bool.mjs
function guard(requirement, consequence, alternative) {
  if (requirement) {
    return consequence;
  } else {
    return alternative();
  }
}

// build/dev/javascript/iv/iv_ffi.mjs
var singleton = (x) => [x];
var pair = (x, y) => [x, y];
var append4 = (xs, x) => [...xs, x];
var prepend2 = (xs, x) => [x, ...xs];
var concat2 = (xs, ys) => [...xs, ...ys];
var get1 = (idx, xs) => xs[idx - 1];
var set1 = (idx, xs, x) => xs.with(idx - 1, x);
var length2 = (xs) => xs.length;
var map3 = (xs, f) => xs.map(f);
var bsl = (a2, b) => a2 << b;
var bsr = (a2, b) => a2 >> b;

// build/dev/javascript/iv/iv/internal/vector.mjs
function fold_loop(loop$xs, loop$state, loop$idx, loop$len, loop$fun) {
  while (true) {
    let xs = loop$xs;
    let state = loop$state;
    let idx = loop$idx;
    let len = loop$len;
    let fun = loop$fun;
    let $ = idx <= len;
    if ($) {
      loop$xs = xs;
      loop$state = fun(state, get1(idx, xs));
      loop$idx = idx + 1;
      loop$len = len;
      loop$fun = fun;
    } else {
      return state;
    }
  }
}
function fold_skip_first(xs, state, fun) {
  let len = length2(xs);
  return fold_loop(xs, state, 2, len, fun);
}
function fold_right_loop(loop$xs, loop$state, loop$idx, loop$fun) {
  while (true) {
    let xs = loop$xs;
    let state = loop$state;
    let idx = loop$idx;
    let fun = loop$fun;
    let $ = idx > 0;
    if ($) {
      loop$xs = xs;
      loop$state = fun(state, get1(idx, xs));
      loop$idx = idx - 1;
      loop$fun = fun;
    } else {
      return state;
    }
  }
}
function fold_right(xs, state, fun) {
  let len = length2(xs);
  return fold_right_loop(xs, state, len, fun);
}

// build/dev/javascript/iv/iv/internal/node.mjs
var Balanced = class extends CustomType {
  constructor(size2, children2) {
    super();
    this.size = size2;
    this.children = children2;
  }
};
var Unbalanced = class extends CustomType {
  constructor(sizes, children2) {
    super();
    this.sizes = sizes;
    this.children = children2;
  }
};
var Leaf = class extends CustomType {
  constructor(children2) {
    super();
    this.children = children2;
  }
};
var Concatenated = class extends CustomType {
  constructor(merged) {
    super();
    this.merged = merged;
  }
};
var NoFreeSlot = class extends CustomType {
  constructor(left, right) {
    super();
    this.left = left;
    this.right = right;
  }
};
function leaf(items) {
  return new Leaf(items);
}
function size(node) {
  if (node instanceof Balanced) {
    let size$1 = node.size;
    return size$1;
  } else if (node instanceof Leaf) {
    let children2 = node.children;
    return length2(children2);
  } else {
    let sizes = node.sizes;
    return get1(length2(sizes), sizes);
  }
}
function compute_sizes(nodes) {
  let first_size = size(get1(1, nodes));
  return fold_skip_first(
    nodes,
    singleton(first_size),
    (sizes, node) => {
      let size$1 = get1(length2(sizes), sizes) + size(node);
      return append4(sizes, size$1);
    }
  );
}
function unbalanced(_, nodes) {
  let sizes = compute_sizes(nodes);
  return new Unbalanced(sizes, nodes);
}
function find_size(loop$sizes, loop$size_idx_plus_one, loop$index) {
  while (true) {
    let sizes = loop$sizes;
    let size_idx_plus_one = loop$size_idx_plus_one;
    let index3 = loop$index;
    let $ = get1(size_idx_plus_one, sizes) > index3;
    if ($) {
      return size_idx_plus_one - 1;
    } else {
      loop$sizes = sizes;
      loop$size_idx_plus_one = size_idx_plus_one + 1;
      loop$index = index3;
    }
  }
}
function map4(node, fun) {
  if (node instanceof Balanced) {
    let size$1 = node.size;
    let children2 = node.children;
    return new Balanced(
      size$1,
      map3(children2, (_capture) => {
        return map4(_capture, fun);
      })
    );
  } else if (node instanceof Unbalanced) {
    let sizes = node.sizes;
    let children2 = node.children;
    return new Unbalanced(
      sizes,
      map3(children2, (_capture) => {
        return map4(_capture, fun);
      })
    );
  } else {
    let children2 = node.children;
    return new Leaf(map3(children2, fun));
  }
}
function fold_right2(node, state, fun) {
  if (node instanceof Balanced) {
    let children2 = node.children;
    return fold_right(
      children2,
      state,
      (state2, node2) => {
        return fold_right2(node2, state2, fun);
      }
    );
  } else if (node instanceof Unbalanced) {
    let children2 = node.children;
    return fold_right(
      children2,
      state,
      (state2, node2) => {
        return fold_right2(node2, state2, fun);
      }
    );
  } else {
    let children2 = node.children;
    return fold_right(children2, state, fun);
  }
}
function balanced(shift, nodes) {
  let len = length2(nodes);
  let last_child = get1(len, nodes);
  let max_size = bsl(1, shift);
  let size$1 = max_size * (len - 1) + size(last_child);
  return new Balanced(size$1, nodes);
}
function branch(shift, nodes) {
  let len = length2(nodes);
  let max_size = bsl(1, shift);
  let sizes = compute_sizes(nodes);
  let prefix_size = (() => {
    if (len === 1) {
      return 0;
    } else {
      return get1(len - 1, sizes);
    }
  })();
  let is_balanced = prefix_size === max_size * (len - 1);
  if (is_balanced) {
    let size$1 = get1(len, sizes);
    return new Balanced(size$1, nodes);
  } else {
    return new Unbalanced(sizes, nodes);
  }
}
var branch_bits = 5;
function get(loop$node, loop$shift, loop$index) {
  while (true) {
    let node = loop$node;
    let shift = loop$shift;
    let index3 = loop$index;
    if (node instanceof Balanced) {
      let children2 = node.children;
      let node_index = bsr(index3, shift);
      let index$1 = index3 - bsl(node_index, shift);
      let child = get1(node_index + 1, children2);
      loop$node = child;
      loop$shift = shift - branch_bits;
      loop$index = index$1;
    } else if (node instanceof Unbalanced) {
      let sizes = node.sizes;
      let children2 = node.children;
      let start_search_index = bsr(index3, shift);
      let node_index = find_size(sizes, start_search_index + 1, index3);
      let index$1 = (() => {
        if (node_index === 0) {
          return index3;
        } else {
          return index3 - get1(node_index, sizes);
        }
      })();
      let child = get1(node_index + 1, children2);
      loop$node = child;
      loop$shift = shift - branch_bits;
      loop$index = index$1;
    } else {
      let children2 = node.children;
      return get1(index3 + 1, children2);
    }
  }
}
function update(shift, node, index3, fun) {
  if (node instanceof Balanced) {
    let size$1 = node.size;
    let children2 = node.children;
    let node_index = bsr(index3, shift);
    let index$1 = index3 - bsl(node_index, shift);
    let new_children = (() => {
      let _pipe = get1(node_index + 1, children2);
      let _pipe$1 = ((_capture) => {
        return update(shift - branch_bits, _capture, index$1, fun);
      })(_pipe);
      return ((_capture) => {
        return set1(node_index + 1, children2, _capture);
      })(_pipe$1);
    })();
    return new Balanced(size$1, new_children);
  } else if (node instanceof Unbalanced) {
    let sizes = node.sizes;
    let children2 = node.children;
    let start_search_index = bsr(index3, shift);
    let node_index = find_size(sizes, start_search_index + 1, index3);
    let index$1 = (() => {
      if (node_index === 0) {
        return index3;
      } else {
        return index3 - get1(node_index, sizes);
      }
    })();
    let new_children = (() => {
      let _pipe = get1(node_index + 1, children2);
      let _pipe$1 = ((_capture) => {
        return update(shift - branch_bits, _capture, index$1, fun);
      })(_pipe);
      return ((_capture) => {
        return set1(node_index + 1, children2, _capture);
      })(_pipe$1);
    })();
    return new Unbalanced(sizes, new_children);
  } else {
    let children2 = node.children;
    let new_children = set1(
      index3 + 1,
      children2,
      fun(get1(index3 + 1, children2))
    );
    return new Leaf(new_children);
  }
}
var branch_factor = 32;
function direct_append_balanced(left_shift, left, left_children, right_shift, right) {
  let left_len = length2(left_children);
  let left_last = get1(left_len, left_children);
  let $ = direct_concat(left_shift - branch_bits, left_last, right_shift, right);
  if ($ instanceof Concatenated) {
    let updated = $.merged;
    let children2 = set1(left_len, left_children, updated);
    return new Concatenated(balanced(left_shift, children2));
  } else if ($ instanceof NoFreeSlot && left_len < 32) {
    let node = $.right;
    let children2 = append4(left_children, node);
    let $1 = size(left_last) === bsl(1, left_shift);
    if ($1) {
      return new Concatenated(balanced(left_shift, children2));
    } else {
      return new Concatenated(unbalanced(left_shift, children2));
    }
  } else {
    let node = $.right;
    return new NoFreeSlot(left, balanced(left_shift, singleton(node)));
  }
}
function direct_concat(left_shift, left, right_shift, right) {
  if (left instanceof Balanced && right instanceof Leaf) {
    let cl = left.children;
    return direct_append_balanced(left_shift, left, cl, right_shift, right);
  } else if (left instanceof Unbalanced && right instanceof Leaf) {
    let sizes = left.sizes;
    let cl = left.children;
    return direct_append_unbalanced(
      left_shift,
      left,
      cl,
      sizes,
      right_shift,
      right
    );
  } else if (left instanceof Leaf && right instanceof Balanced) {
    let cr = right.children;
    return direct_prepend_balanced(left_shift, left, right_shift, right, cr);
  } else if (left instanceof Leaf && right instanceof Unbalanced) {
    let sr = right.sizes;
    let cr = right.children;
    return direct_prepend_unbalanced(
      left_shift,
      left,
      right_shift,
      right,
      cr,
      sr
    );
  } else if (left instanceof Leaf && right instanceof Leaf) {
    let cl = left.children;
    let cr = right.children;
    let $ = length2(cl) + length2(cr) <= branch_factor;
    if ($) {
      return new Concatenated(new Leaf(concat2(cl, cr)));
    } else {
      return new NoFreeSlot(left, right);
    }
  } else if (left instanceof Balanced && left_shift > right_shift) {
    let cl = left.children;
    return direct_append_balanced(left_shift, left, cl, right_shift, right);
  } else if (left instanceof Unbalanced && left_shift > right_shift) {
    let sizes = left.sizes;
    let cl = left.children;
    return direct_append_unbalanced(
      left_shift,
      left,
      cl,
      sizes,
      right_shift,
      right
    );
  } else if (right instanceof Balanced && right_shift > left_shift) {
    let cr = right.children;
    return direct_prepend_balanced(left_shift, left, right_shift, right, cr);
  } else if (right instanceof Unbalanced && right_shift > left_shift) {
    let sr = right.sizes;
    let cr = right.children;
    return direct_prepend_unbalanced(
      left_shift,
      left,
      right_shift,
      right,
      cr,
      sr
    );
  } else if (left instanceof Balanced && right instanceof Balanced) {
    let cl = left.children;
    let cr = right.children;
    let $ = length2(cl) + length2(cr) <= branch_factor;
    if ($) {
      let merged = concat2(cl, cr);
      let left_last = get1(length2(cl), cl);
      let $1 = size(left_last) === bsl(1, left_shift);
      if ($1) {
        return new Concatenated(balanced(left_shift, merged));
      } else {
        return new Concatenated(unbalanced(left_shift, merged));
      }
    } else {
      return new NoFreeSlot(left, right);
    }
  } else if (left instanceof Balanced && right instanceof Unbalanced) {
    let cl = left.children;
    let cr = right.children;
    let $ = length2(cl) + length2(cr) <= branch_factor;
    if ($) {
      let merged = concat2(cl, cr);
      return new Concatenated(unbalanced(left_shift, merged));
    } else {
      return new NoFreeSlot(left, right);
    }
  } else if (left instanceof Unbalanced && right instanceof Balanced) {
    let cl = left.children;
    let cr = right.children;
    let $ = length2(cl) + length2(cr) <= branch_factor;
    if ($) {
      let merged = concat2(cl, cr);
      return new Concatenated(unbalanced(left_shift, merged));
    } else {
      return new NoFreeSlot(left, right);
    }
  } else {
    let cl = left.children;
    let cr = right.children;
    let $ = length2(cl) + length2(cr) <= branch_factor;
    if ($) {
      let merged = concat2(cl, cr);
      return new Concatenated(unbalanced(left_shift, merged));
    } else {
      return new NoFreeSlot(left, right);
    }
  }
}
function direct_append_unbalanced(left_shift, left, left_children, sizes, right_shift, right) {
  let left_len = length2(left_children);
  let left_last = get1(left_len, left_children);
  let $ = direct_concat(left_shift - branch_bits, left_last, right_shift, right);
  if ($ instanceof Concatenated) {
    let updated = $.merged;
    let children2 = set1(left_len, left_children, updated);
    let last_size = get1(left_len, sizes) + size(updated);
    let sizes$1 = set1(left_len, sizes, last_size);
    return new Concatenated(new Unbalanced(sizes$1, children2));
  } else if ($ instanceof NoFreeSlot && left_len < 32) {
    let node = $.right;
    let children2 = append4(left_children, node);
    let sizes$1 = append4(
      sizes,
      get1(left_len, sizes) + size(node)
    );
    return new Concatenated(new Unbalanced(sizes$1, children2));
  } else {
    let node = $.right;
    return new NoFreeSlot(left, balanced(left_shift, singleton(node)));
  }
}
function direct_prepend_balanced(left_shift, left, right_shift, right, right_children) {
  let right_len = length2(right_children);
  let right_first = get1(1, right_children);
  let $ = direct_concat(
    left_shift,
    left,
    right_shift - branch_bits,
    right_first
  );
  if ($ instanceof Concatenated) {
    let updated = $.merged;
    let children2 = set1(1, right_children, updated);
    return new Concatenated(unbalanced(right_shift, children2));
  } else if ($ instanceof NoFreeSlot && right_len < 32) {
    let node = $.left;
    let children2 = prepend2(right_children, node);
    return new Concatenated(unbalanced(right_shift, children2));
  } else {
    let node = $.left;
    return new NoFreeSlot(balanced(right_shift, singleton(node)), right);
  }
}
function direct_prepend_unbalanced(left_shift, left, right_shift, right, right_children, sizes) {
  let right_len = length2(right_children);
  let right_first = get1(1, right_children);
  let $ = direct_concat(
    left_shift,
    left,
    right_shift - branch_bits,
    right_first
  );
  if ($ instanceof Concatenated) {
    let updated = $.merged;
    let children2 = set1(1, right_children, updated);
    let size_delta = size(updated) - size(right_first);
    let sizes$1 = map3(sizes, (s) => {
      return s + size_delta;
    });
    return new Concatenated(new Unbalanced(sizes$1, children2));
  } else if ($ instanceof NoFreeSlot && right_len < 32) {
    let node = $.left;
    let children2 = prepend2(right_children, node);
    let size$1 = size(node);
    let sizes$1 = (() => {
      let _pipe = sizes;
      let _pipe$1 = map3(_pipe, (s) => {
        return s + size$1;
      });
      return prepend2(_pipe$1, size$1);
    })();
    return new Concatenated(new Unbalanced(sizes$1, children2));
  } else {
    let node = $.left;
    return new NoFreeSlot(balanced(right_shift, singleton(node)), right);
  }
}

// build/dev/javascript/iv/iv.mjs
var Empty2 = class extends CustomType {
};
var Array2 = class extends CustomType {
  constructor(shift, root) {
    super();
    this.shift = shift;
    this.root = root;
  }
};
function array2(shift, nodes) {
  let $ = length2(nodes);
  if ($ === 0) {
    return new Empty2();
  } else if ($ === 1) {
    return new Array2(shift, get1(1, nodes));
  } else {
    let shift$1 = shift + branch_bits;
    return new Array2(shift$1, branch(shift$1, nodes));
  }
}
function new$3() {
  return new Empty2();
}
function wrap(item) {
  return new Array2(0, leaf(singleton(item)));
}
function get2(array4, index3) {
  if (array4 instanceof Array2) {
    let shift = array4.shift;
    let root = array4.root;
    let $ = 0 <= index3 && index3 < size(root);
    if ($) {
      return new Ok(get(root, shift, index3));
    } else {
      return new Error(void 0);
    }
  } else {
    return new Error(void 0);
  }
}
function try_update(array4, index3, fun) {
  if (array4 instanceof Array2) {
    let shift = array4.shift;
    let root = array4.root;
    let $ = 0 <= index3 && index3 < size(root);
    if ($) {
      return new Array2(shift, update(shift, root, index3, fun));
    } else {
      return array4;
    }
  } else {
    return array4;
  }
}
function try_set(array4, index3, item) {
  return try_update(array4, index3, (_) => {
    return item;
  });
}
function direct_concat2(left, right) {
  if (left instanceof Empty2) {
    return right;
  } else if (right instanceof Empty2) {
    return left;
  } else {
    let left_shift = left.shift;
    let left$1 = left.root;
    let right_shift = right.shift;
    let right$1 = right.root;
    let shift = (() => {
      let $2 = left_shift > right_shift;
      if ($2) {
        return left_shift;
      } else {
        return right_shift;
      }
    })();
    let $ = direct_concat(left_shift, left$1, right_shift, right$1);
    if ($ instanceof Concatenated) {
      let root = $.merged;
      return new Array2(shift, root);
    } else {
      let left$2 = $.left;
      let right$2 = $.right;
      return array2(shift, pair(left$2, right$2));
    }
  }
}
function append5(array4, item) {
  return direct_concat2(array4, wrap(item));
}
function map5(array4, fun) {
  if (array4 instanceof Empty2) {
    return new Empty2();
  } else {
    let shift = array4.shift;
    let root = array4.root;
    return new Array2(shift, map4(root, fun));
  }
}
function fold_right3(array4, state, fun) {
  if (array4 instanceof Empty2) {
    return state;
  } else {
    let root = array4.root;
    return fold_right2(root, state, fun);
  }
}

// build/dev/javascript/lustre/lustre/effect.mjs
var Effect = class extends CustomType {
  constructor(all2) {
    super();
    this.all = all2;
  }
};
function custom(run2) {
  return new Effect(
    toList([
      (actions) => {
        return run2(actions.dispatch, actions.emit, actions.select, actions.root);
      }
    ])
  );
}
function from(effect) {
  return custom((dispatch, _, _1, _2) => {
    return effect(dispatch);
  });
}
function none() {
  return new Effect(toList([]));
}

// build/dev/javascript/lustre/lustre/internals/vdom.mjs
var Text = class extends CustomType {
  constructor(content) {
    super();
    this.content = content;
  }
};
var Element = class extends CustomType {
  constructor(key, namespace, tag, attrs, children2, self_closing, void$) {
    super();
    this.key = key;
    this.namespace = namespace;
    this.tag = tag;
    this.attrs = attrs;
    this.children = children2;
    this.self_closing = self_closing;
    this.void = void$;
  }
};
var Map2 = class extends CustomType {
  constructor(subtree) {
    super();
    this.subtree = subtree;
  }
};
var Attribute = class extends CustomType {
  constructor(x0, x1, as_property) {
    super();
    this[0] = x0;
    this[1] = x1;
    this.as_property = as_property;
  }
};
var Event = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
function attribute_to_event_handler(attribute2) {
  if (attribute2 instanceof Attribute) {
    return new Error(void 0);
  } else {
    let name = attribute2[0];
    let handler = attribute2[1];
    let name$1 = drop_start(name, 2);
    return new Ok([name$1, handler]);
  }
}
function do_element_list_handlers(elements2, handlers2, key) {
  return index_fold(
    elements2,
    handlers2,
    (handlers3, element2, index3) => {
      let key$1 = key + "-" + to_string(index3);
      return do_handlers(element2, handlers3, key$1);
    }
  );
}
function do_handlers(loop$element, loop$handlers, loop$key) {
  while (true) {
    let element2 = loop$element;
    let handlers2 = loop$handlers;
    let key = loop$key;
    if (element2 instanceof Text) {
      return handlers2;
    } else if (element2 instanceof Map2) {
      let subtree = element2.subtree;
      loop$element = subtree();
      loop$handlers = handlers2;
      loop$key = key;
    } else {
      let attrs = element2.attrs;
      let children2 = element2.children;
      let handlers$1 = fold(
        attrs,
        handlers2,
        (handlers3, attr) => {
          let $ = attribute_to_event_handler(attr);
          if ($.isOk()) {
            let name = $[0][0];
            let handler = $[0][1];
            return insert(handlers3, key + "-" + name, handler);
          } else {
            return handlers3;
          }
        }
      );
      return do_element_list_handlers(children2, handlers$1, key);
    }
  }
}
function handlers(element2) {
  return do_handlers(element2, new_map(), "0");
}

// build/dev/javascript/lustre/lustre/attribute.mjs
function attribute(name, value3) {
  return new Attribute(name, identity(value3), false);
}
function property(name, value3) {
  return new Attribute(name, identity(value3), true);
}
function on(name, handler) {
  return new Event("on" + name, handler);
}
function style(properties) {
  return attribute(
    "style",
    fold(
      properties,
      "",
      (styles, _use1) => {
        let name$1 = _use1[0];
        let value$1 = _use1[1];
        return styles + name$1 + ":" + value$1 + ";";
      }
    )
  );
}
function class$(name) {
  return attribute("class", name);
}
function classes(names) {
  return attribute(
    "class",
    (() => {
      let _pipe = names;
      let _pipe$1 = filter_map(
        _pipe,
        (class$2) => {
          let $ = class$2[1];
          if ($) {
            return new Ok(class$2[0]);
          } else {
            return new Error(void 0);
          }
        }
      );
      return join(_pipe$1, " ");
    })()
  );
}
function id(name) {
  return attribute("id", name);
}
function type_(name) {
  return attribute("type", name);
}
function value(val) {
  return attribute("value", val);
}
function checked(is_checked) {
  return property("checked", is_checked);
}
function placeholder(text3) {
  return attribute("placeholder", text3);
}
function autofocus(should_autofocus) {
  return property("autofocus", should_autofocus);
}
function for$(id2) {
  return attribute("for", id2);
}
function href(uri) {
  return attribute("href", uri);
}

// build/dev/javascript/lustre/lustre/element.mjs
function element(tag, attrs, children2) {
  if (tag === "area") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "base") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "br") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "col") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "embed") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "hr") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "img") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "input") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "link") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "meta") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "param") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "source") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "track") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "wbr") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else {
    return new Element("", "", tag, attrs, children2, false, false);
  }
}
function do_keyed(el, key) {
  if (el instanceof Element) {
    let namespace = el.namespace;
    let tag = el.tag;
    let attrs = el.attrs;
    let children2 = el.children;
    let self_closing = el.self_closing;
    let void$ = el.void;
    return new Element(
      key,
      namespace,
      tag,
      attrs,
      children2,
      self_closing,
      void$
    );
  } else if (el instanceof Map2) {
    let subtree = el.subtree;
    return new Map2(() => {
      return do_keyed(subtree(), key);
    });
  } else {
    return el;
  }
}
function keyed(el, children2) {
  return el(
    map(
      children2,
      (_use0) => {
        let key = _use0[0];
        let child = _use0[1];
        return do_keyed(child, key);
      }
    )
  );
}
function text(content) {
  return new Text(content);
}
function fragment(elements2) {
  return element(
    "lustre-fragment",
    toList([style(toList([["display", "contents"]]))]),
    elements2
  );
}

// build/dev/javascript/gleam_stdlib/gleam/set.mjs
var Set2 = class extends CustomType {
  constructor(dict2) {
    super();
    this.dict = dict2;
  }
};
function new$5() {
  return new Set2(new_map());
}

// build/dev/javascript/lustre/lustre/internals/patch.mjs
var Diff = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Emit = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Init = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
function is_empty_element_diff(diff2) {
  return isEqual(diff2.created, new_map()) && isEqual(
    diff2.removed,
    new$5()
  ) && isEqual(diff2.updated, new_map());
}

// build/dev/javascript/lustre/lustre/internals/runtime.mjs
var Attrs = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Batch = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Debug = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Dispatch = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Emit2 = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Event2 = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Shutdown = class extends CustomType {
};
var Subscribe = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Unsubscribe = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var ForceModel = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};

// build/dev/javascript/lustre/vdom.ffi.mjs
if (globalThis.customElements && !globalThis.customElements.get("lustre-fragment")) {
  globalThis.customElements.define(
    "lustre-fragment",
    class LustreFragment extends HTMLElement {
      constructor() {
        super();
      }
    }
  );
}
function morph(prev, next, dispatch) {
  let out;
  let stack = [{ prev, next, parent: prev.parentNode }];
  while (stack.length) {
    let { prev: prev2, next: next2, parent } = stack.pop();
    while (next2.subtree !== void 0) next2 = next2.subtree();
    if (next2.content !== void 0) {
      if (!prev2) {
        const created = document.createTextNode(next2.content);
        parent.appendChild(created);
        out ??= created;
      } else if (prev2.nodeType === Node.TEXT_NODE) {
        if (prev2.textContent !== next2.content) prev2.textContent = next2.content;
        out ??= prev2;
      } else {
        const created = document.createTextNode(next2.content);
        parent.replaceChild(created, prev2);
        out ??= created;
      }
    } else if (next2.tag !== void 0) {
      const created = createElementNode({
        prev: prev2,
        next: next2,
        dispatch,
        stack
      });
      if (!prev2) {
        parent.appendChild(created);
      } else if (prev2 !== created) {
        parent.replaceChild(created, prev2);
      }
      out ??= created;
    }
  }
  return out;
}
function createElementNode({ prev, next, dispatch, stack }) {
  const namespace = next.namespace || "http://www.w3.org/1999/xhtml";
  const canMorph = prev && prev.nodeType === Node.ELEMENT_NODE && prev.localName === next.tag && prev.namespaceURI === (next.namespace || "http://www.w3.org/1999/xhtml");
  const el = canMorph ? prev : namespace ? document.createElementNS(namespace, next.tag) : document.createElement(next.tag);
  let handlersForEl;
  if (!registeredHandlers.has(el)) {
    const emptyHandlers = /* @__PURE__ */ new Map();
    registeredHandlers.set(el, emptyHandlers);
    handlersForEl = emptyHandlers;
  } else {
    handlersForEl = registeredHandlers.get(el);
  }
  const prevHandlers = canMorph ? new Set(handlersForEl.keys()) : null;
  const prevAttributes = canMorph ? new Set(Array.from(prev.attributes, (a2) => a2.name)) : null;
  let className = null;
  let style2 = null;
  let innerHTML = null;
  if (canMorph && next.tag === "textarea") {
    const innertText = next.children[Symbol.iterator]().next().value?.content;
    if (innertText !== void 0) el.value = innertText;
  }
  const delegated = [];
  for (const attr of next.attrs) {
    const name = attr[0];
    const value3 = attr[1];
    if (attr.as_property) {
      if (el[name] !== value3) el[name] = value3;
      if (canMorph) prevAttributes.delete(name);
    } else if (name.startsWith("on")) {
      const eventName = name.slice(2);
      const callback = dispatch(value3, eventName === "input");
      if (!handlersForEl.has(eventName)) {
        el.addEventListener(eventName, lustreGenericEventHandler);
      }
      handlersForEl.set(eventName, callback);
      if (canMorph) prevHandlers.delete(eventName);
    } else if (name.startsWith("data-lustre-on-")) {
      const eventName = name.slice(15);
      const callback = dispatch(lustreServerEventHandler);
      if (!handlersForEl.has(eventName)) {
        el.addEventListener(eventName, lustreGenericEventHandler);
      }
      handlersForEl.set(eventName, callback);
      el.setAttribute(name, value3);
      if (canMorph) {
        prevHandlers.delete(eventName);
        prevAttributes.delete(name);
      }
    } else if (name.startsWith("delegate:data-") || name.startsWith("delegate:aria-")) {
      el.setAttribute(name, value3);
      delegated.push([name.slice(10), value3]);
    } else if (name === "class") {
      className = className === null ? value3 : className + " " + value3;
    } else if (name === "style") {
      style2 = style2 === null ? value3 : style2 + value3;
    } else if (name === "dangerous-unescaped-html") {
      innerHTML = value3;
    } else {
      if (el.getAttribute(name) !== value3) el.setAttribute(name, value3);
      if (name === "value" || name === "selected") el[name] = value3;
      if (canMorph) prevAttributes.delete(name);
    }
  }
  if (className !== null) {
    el.setAttribute("class", className);
    if (canMorph) prevAttributes.delete("class");
  }
  if (style2 !== null) {
    el.setAttribute("style", style2);
    if (canMorph) prevAttributes.delete("style");
  }
  if (canMorph) {
    for (const attr of prevAttributes) {
      el.removeAttribute(attr);
    }
    for (const eventName of prevHandlers) {
      handlersForEl.delete(eventName);
      el.removeEventListener(eventName, lustreGenericEventHandler);
    }
  }
  if (next.tag === "slot") {
    window.queueMicrotask(() => {
      for (const child of el.assignedElements()) {
        for (const [name, value3] of delegated) {
          if (!child.hasAttribute(name)) {
            child.setAttribute(name, value3);
          }
        }
      }
    });
  }
  if (next.key !== void 0 && next.key !== "") {
    el.setAttribute("data-lustre-key", next.key);
  } else if (innerHTML !== null) {
    el.innerHTML = innerHTML;
    return el;
  }
  let prevChild = el.firstChild;
  let seenKeys = null;
  let keyedChildren = null;
  let incomingKeyedChildren = null;
  let firstChild = children(next).next().value;
  if (canMorph && firstChild !== void 0 && // Explicit checks are more verbose but truthy checks force a bunch of comparisons
  // we don't care about: it's never gonna be a number etc.
  firstChild.key !== void 0 && firstChild.key !== "") {
    seenKeys = /* @__PURE__ */ new Set();
    keyedChildren = getKeyedChildren(prev);
    incomingKeyedChildren = getKeyedChildren(next);
    for (const child of children(next)) {
      prevChild = diffKeyedChild(
        prevChild,
        child,
        el,
        stack,
        incomingKeyedChildren,
        keyedChildren,
        seenKeys
      );
    }
  } else {
    for (const child of children(next)) {
      stack.unshift({ prev: prevChild, next: child, parent: el });
      prevChild = prevChild?.nextSibling;
    }
  }
  while (prevChild) {
    const next2 = prevChild.nextSibling;
    el.removeChild(prevChild);
    prevChild = next2;
  }
  return el;
}
var registeredHandlers = /* @__PURE__ */ new WeakMap();
function lustreGenericEventHandler(event2) {
  const target = event2.currentTarget;
  if (!registeredHandlers.has(target)) {
    target.removeEventListener(event2.type, lustreGenericEventHandler);
    return;
  }
  const handlersForEventTarget = registeredHandlers.get(target);
  if (!handlersForEventTarget.has(event2.type)) {
    target.removeEventListener(event2.type, lustreGenericEventHandler);
    return;
  }
  handlersForEventTarget.get(event2.type)(event2);
}
function lustreServerEventHandler(event2) {
  const el = event2.currentTarget;
  const tag = el.getAttribute(`data-lustre-on-${event2.type}`);
  const data = JSON.parse(el.getAttribute("data-lustre-data") || "{}");
  const include = JSON.parse(el.getAttribute("data-lustre-include") || "[]");
  switch (event2.type) {
    case "input":
    case "change":
      include.push("target.value");
      break;
  }
  return {
    tag,
    data: include.reduce(
      (data2, property2) => {
        const path = property2.split(".");
        for (let i = 0, o = data2, e = event2; i < path.length; i++) {
          if (i === path.length - 1) {
            o[path[i]] = e[path[i]];
          } else {
            o[path[i]] ??= {};
            e = e[path[i]];
            o = o[path[i]];
          }
        }
        return data2;
      },
      { data }
    )
  };
}
function getKeyedChildren(el) {
  const keyedChildren = /* @__PURE__ */ new Map();
  if (el) {
    for (const child of children(el)) {
      const key = child?.key || child?.getAttribute?.("data-lustre-key");
      if (key) keyedChildren.set(key, child);
    }
  }
  return keyedChildren;
}
function diffKeyedChild(prevChild, child, el, stack, incomingKeyedChildren, keyedChildren, seenKeys) {
  while (prevChild && !incomingKeyedChildren.has(prevChild.getAttribute("data-lustre-key"))) {
    const nextChild = prevChild.nextSibling;
    el.removeChild(prevChild);
    prevChild = nextChild;
  }
  if (keyedChildren.size === 0) {
    stack.unshift({ prev: prevChild, next: child, parent: el });
    prevChild = prevChild?.nextSibling;
    return prevChild;
  }
  if (seenKeys.has(child.key)) {
    console.warn(`Duplicate key found in Lustre vnode: ${child.key}`);
    stack.unshift({ prev: null, next: child, parent: el });
    return prevChild;
  }
  seenKeys.add(child.key);
  const keyedChild = keyedChildren.get(child.key);
  if (!keyedChild && !prevChild) {
    stack.unshift({ prev: null, next: child, parent: el });
    return prevChild;
  }
  if (!keyedChild && prevChild !== null) {
    const placeholder2 = document.createTextNode("");
    el.insertBefore(placeholder2, prevChild);
    stack.unshift({ prev: placeholder2, next: child, parent: el });
    return prevChild;
  }
  if (!keyedChild || keyedChild === prevChild) {
    stack.unshift({ prev: prevChild, next: child, parent: el });
    prevChild = prevChild?.nextSibling;
    return prevChild;
  }
  el.insertBefore(keyedChild, prevChild);
  stack.unshift({ prev: keyedChild, next: child, parent: el });
  return prevChild;
}
function* children(element2) {
  for (const child of element2.children) {
    yield* forceChild(child);
  }
}
function* forceChild(element2) {
  if (element2.subtree !== void 0) {
    yield* forceChild(element2.subtree());
  } else {
    yield element2;
  }
}

// build/dev/javascript/lustre/lustre.ffi.mjs
var LustreClientApplication = class _LustreClientApplication {
  /**
   * @template Flags
   *
   * @param {object} app
   * @param {(flags: Flags) => [Model, Lustre.Effect<Msg>]} app.init
   * @param {(msg: Msg, model: Model) => [Model, Lustre.Effect<Msg>]} app.update
   * @param {(model: Model) => Lustre.Element<Msg>} app.view
   * @param {string | HTMLElement} selector
   * @param {Flags} flags
   *
   * @returns {Gleam.Ok<(action: Lustre.Action<Lustre.Client, Msg>>) => void>}
   */
  static start({ init: init3, update: update3, view: view2 }, selector, flags) {
    if (!is_browser()) return new Error(new NotABrowser());
    const root = selector instanceof HTMLElement ? selector : document.querySelector(selector);
    if (!root) return new Error(new ElementNotFound(selector));
    const app = new _LustreClientApplication(root, init3(flags), update3, view2);
    return new Ok((action) => app.send(action));
  }
  /**
   * @param {Element} root
   * @param {[Model, Lustre.Effect<Msg>]} init
   * @param {(model: Model, msg: Msg) => [Model, Lustre.Effect<Msg>]} update
   * @param {(model: Model) => Lustre.Element<Msg>} view
   *
   * @returns {LustreClientApplication}
   */
  constructor(root, [init3, effects], update3, view2) {
    this.root = root;
    this.#model = init3;
    this.#update = update3;
    this.#view = view2;
    this.#tickScheduled = window.setTimeout(
      () => this.#tick(effects.all.toArray(), true),
      0
    );
  }
  /** @type {Element} */
  root;
  /**
   * @param {Lustre.Action<Lustre.Client, Msg>} action
   *
   * @returns {void}
   */
  send(action) {
    if (action instanceof Debug) {
      if (action[0] instanceof ForceModel) {
        this.#tickScheduled = window.clearTimeout(this.#tickScheduled);
        this.#queue = [];
        this.#model = action[0][0];
        const vdom = this.#view(this.#model);
        const dispatch = (handler, immediate = false) => (event2) => {
          const result = handler(event2);
          if (result instanceof Ok) {
            this.send(new Dispatch(result[0], immediate));
          }
        };
        const prev = this.root.firstChild ?? this.root.appendChild(document.createTextNode(""));
        morph(prev, vdom, dispatch);
      }
    } else if (action instanceof Dispatch) {
      const msg = action[0];
      const immediate = action[1] ?? false;
      this.#queue.push(msg);
      if (immediate) {
        this.#tickScheduled = window.clearTimeout(this.#tickScheduled);
        this.#tick();
      } else if (!this.#tickScheduled) {
        this.#tickScheduled = window.setTimeout(() => this.#tick());
      }
    } else if (action instanceof Emit2) {
      const event2 = action[0];
      const data = action[1];
      this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
    } else if (action instanceof Shutdown) {
      this.#tickScheduled = window.clearTimeout(this.#tickScheduled);
      this.#model = null;
      this.#update = null;
      this.#view = null;
      this.#queue = null;
      while (this.root.firstChild) {
        this.root.firstChild.remove();
      }
    }
  }
  /** @type {Model} */
  #model;
  /** @type {(model: Model, msg: Msg) => [Model, Lustre.Effect<Msg>]} */
  #update;
  /** @type {(model: Model) => Lustre.Element<Msg>} */
  #view;
  /** @type {Array<Msg>} */
  #queue = [];
  /** @type {number | undefined} */
  #tickScheduled;
  /**
   * @param {Lustre.Effect<Msg>[]} effects
   */
  #tick(effects = []) {
    this.#tickScheduled = void 0;
    this.#flush(effects);
    const vdom = this.#view(this.#model);
    const dispatch = (handler, immediate = false) => (event2) => {
      const result = handler(event2);
      if (result instanceof Ok) {
        this.send(new Dispatch(result[0], immediate));
      }
    };
    const prev = this.root.firstChild ?? this.root.appendChild(document.createTextNode(""));
    morph(prev, vdom, dispatch);
  }
  #flush(effects = []) {
    while (this.#queue.length > 0) {
      const msg = this.#queue.shift();
      const [next, effect] = this.#update(this.#model, msg);
      effects = effects.concat(effect.all.toArray());
      this.#model = next;
    }
    while (effects.length > 0) {
      const effect = effects.shift();
      const dispatch = (msg) => this.send(new Dispatch(msg));
      const emit2 = (event2, data) => this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
      const select = () => {
      };
      const root = this.root;
      effect({ dispatch, emit: emit2, select, root });
    }
    if (this.#queue.length > 0) {
      this.#flush(effects);
    }
  }
};
var start = LustreClientApplication.start;
var LustreServerApplication = class _LustreServerApplication {
  static start({ init: init3, update: update3, view: view2, on_attribute_change }, flags) {
    const app = new _LustreServerApplication(
      init3(flags),
      update3,
      view2,
      on_attribute_change
    );
    return new Ok((action) => app.send(action));
  }
  constructor([model, effects], update3, view2, on_attribute_change) {
    this.#model = model;
    this.#update = update3;
    this.#view = view2;
    this.#html = view2(model);
    this.#onAttributeChange = on_attribute_change;
    this.#renderers = /* @__PURE__ */ new Map();
    this.#handlers = handlers(this.#html);
    this.#tick(effects.all.toArray());
  }
  send(action) {
    if (action instanceof Attrs) {
      for (const attr of action[0]) {
        const decoder = this.#onAttributeChange.get(attr[0]);
        if (!decoder) continue;
        const msg = decoder(attr[1]);
        if (msg instanceof Error) continue;
        this.#queue.push(msg);
      }
      this.#tick();
    } else if (action instanceof Batch) {
      this.#queue = this.#queue.concat(action[0].toArray());
      this.#tick(action[1].all.toArray());
    } else if (action instanceof Debug) {
    } else if (action instanceof Dispatch) {
      this.#queue.push(action[0]);
      this.#tick();
    } else if (action instanceof Emit2) {
      const event2 = new Emit(action[0], action[1]);
      for (const [_, renderer] of this.#renderers) {
        renderer(event2);
      }
    } else if (action instanceof Event2) {
      const handler = this.#handlers.get(action[0]);
      if (!handler) return;
      const msg = handler(action[1]);
      if (msg instanceof Error) return;
      this.#queue.push(msg[0]);
      this.#tick();
    } else if (action instanceof Subscribe) {
      const attrs = keys(this.#onAttributeChange);
      const patch = new Init(attrs, this.#html);
      this.#renderers = this.#renderers.set(action[0], action[1]);
      action[1](patch);
    } else if (action instanceof Unsubscribe) {
      this.#renderers = this.#renderers.delete(action[0]);
    }
  }
  #model;
  #update;
  #queue;
  #view;
  #html;
  #renderers;
  #handlers;
  #onAttributeChange;
  #tick(effects = []) {
    this.#flush(effects);
    const vdom = this.#view(this.#model);
    const diff2 = elements(this.#html, vdom);
    if (!is_empty_element_diff(diff2)) {
      const patch = new Diff(diff2);
      for (const [_, renderer] of this.#renderers) {
        renderer(patch);
      }
    }
    this.#html = vdom;
    this.#handlers = diff2.handlers;
  }
  #flush(effects = []) {
    while (this.#queue.length > 0) {
      const msg = this.#queue.shift();
      const [next, effect] = this.#update(this.#model, msg);
      effects = effects.concat(effect.all.toArray());
      this.#model = next;
    }
    while (effects.length > 0) {
      const effect = effects.shift();
      const dispatch = (msg) => this.send(new Dispatch(msg));
      const emit2 = (event2, data) => this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
      const select = () => {
      };
      const root = null;
      effect({ dispatch, emit: emit2, select, root });
    }
    if (this.#queue.length > 0) {
      this.#flush(effects);
    }
  }
};
var start_server_application = LustreServerApplication.start;
var is_browser = () => globalThis.window && window.document;

// build/dev/javascript/lustre/lustre.mjs
var App = class extends CustomType {
  constructor(init3, update3, view2, on_attribute_change) {
    super();
    this.init = init3;
    this.update = update3;
    this.view = view2;
    this.on_attribute_change = on_attribute_change;
  }
};
var ElementNotFound = class extends CustomType {
  constructor(selector) {
    super();
    this.selector = selector;
  }
};
var NotABrowser = class extends CustomType {
};
function application(init3, update3, view2) {
  return new App(init3, update3, view2, new None());
}
function start2(app, selector, flags) {
  return guard(
    !is_browser(),
    new Error(new NotABrowser()),
    () => {
      return start(app, selector, flags);
    }
  );
}

// build/dev/javascript/lustre/lustre/element/html.mjs
function text2(content) {
  return text(content);
}
function footer(attrs, children2) {
  return element("footer", attrs, children2);
}
function header(attrs, children2) {
  return element("header", attrs, children2);
}
function h1(attrs, children2) {
  return element("h1", attrs, children2);
}
function section(attrs, children2) {
  return element("section", attrs, children2);
}
function div(attrs, children2) {
  return element("div", attrs, children2);
}
function li(attrs, children2) {
  return element("li", attrs, children2);
}
function ul(attrs, children2) {
  return element("ul", attrs, children2);
}
function a(attrs, children2) {
  return element("a", attrs, children2);
}
function span(attrs, children2) {
  return element("span", attrs, children2);
}
function strong(attrs, children2) {
  return element("strong", attrs, children2);
}
function button(attrs, children2) {
  return element("button", attrs, children2);
}
function input(attrs) {
  return element("input", attrs, toList([]));
}
function label(attrs, children2) {
  return element("label", attrs, children2);
}

// build/dev/javascript/lustre/lustre/event.mjs
function on2(name, handler) {
  return on(name, handler);
}
function on_click(msg) {
  return on2("click", (_) => {
    return new Ok(msg);
  });
}
function on_blur(msg) {
  return on2("blur", (_) => {
    return new Ok(msg);
  });
}
function value2(event2) {
  let _pipe = event2;
  return field("target", field("value", string))(
    _pipe
  );
}
function on_input(msg) {
  return on2(
    "input",
    (event2) => {
      let _pipe = value2(event2);
      return map2(_pipe, msg);
    }
  );
}
function checked2(event2) {
  let _pipe = event2;
  return field("target", field("checked", bool))(
    _pipe
  );
}
function on_check(msg) {
  return on2(
    "change",
    (event2) => {
      let _pipe = checked2(event2);
      return map2(_pipe, msg);
    }
  );
}

// build/dev/javascript/todomvc/todomvc.ffi.mjs
var focus = (id2) => requestAnimationFrame(() => document.getElementById(id2)?.focus());

// build/dev/javascript/todomvc/todomvc.mjs
var Model2 = class extends CustomType {
  constructor(entries, active, completed, input2, uid, visibility) {
    super();
    this.entries = entries;
    this.active = active;
    this.completed = completed;
    this.input = input2;
    this.uid = uid;
    this.visibility = visibility;
  }
};
var Entry = class extends CustomType {
  constructor(description, completed, editing, deleted, id2) {
    super();
    this.description = description;
    this.completed = completed;
    this.editing = editing;
    this.deleted = deleted;
    this.id = id2;
  }
};
var All = class extends CustomType {
};
var Active = class extends CustomType {
};
var Completed = class extends CustomType {
};
var UserEditedInput = class extends CustomType {
  constructor(value3) {
    super();
    this.value = value3;
  }
};
var UserSubmittedInput = class extends CustomType {
};
var UserClickedClearCompleted = class extends CustomType {
};
var UserToggledAllCompleted = class extends CustomType {
  constructor(completed) {
    super();
    this.completed = completed;
  }
};
var UserChangedVisibility = class extends CustomType {
  constructor(visibility) {
    super();
    this.visibility = visibility;
  }
};
var UserClickedDestroy = class extends CustomType {
  constructor(index3) {
    super();
    this.index = index3;
  }
};
var UserToggledCompleted = class extends CustomType {
  constructor(index3, completed) {
    super();
    this.index = index3;
    this.completed = completed;
  }
};
var UserToggledEditing = class extends CustomType {
  constructor(index3, editing) {
    super();
    this.index = index3;
    this.editing = editing;
  }
};
var UserEditedDescription = class extends CustomType {
  constructor(index3, description) {
    super();
    this.index = index3;
    this.description = description;
  }
};
function new_entry(description, id2) {
  return new Entry(description, false, false, false, id2);
}
function init2(_) {
  let model = new Model2(new$3(), 0, 0, "", 0, new All());
  return [model, none()];
}
function view_active_count(entries_left) {
  let item = (() => {
    if (entries_left === 1) {
      return "item";
    } else {
      return "items";
    }
  })();
  return span(
    toList([class$("todo-count")]),
    toList([
      strong(
        toList([]),
        toList([text2(to_string(entries_left))])
      ),
      text2(" "),
      text2(item),
      text2(" left")
    ])
  );
}
function visibility_control(url, visibility, actual_visibility) {
  return li(
    toList([on_click(new UserChangedVisibility(visibility))]),
    toList([
      a(
        toList([
          href(url),
          classes(
            toList([["selected", isEqual(visibility, actual_visibility)]])
          )
        ]),
        toList([
          (() => {
            if (visibility instanceof All) {
              return text2("All");
            } else if (visibility instanceof Active) {
              return text2("Active");
            } else {
              return text2("Completed");
            }
          })()
        ])
      )
    ])
  );
}
function view_filters(visibility) {
  return ul(
    toList([class$("filters")]),
    toList([
      visibility_control("#/", new All(), visibility),
      visibility_control("#/active", new Active(), visibility),
      visibility_control("#/completed", new Completed(), visibility)
    ])
  );
}
function hidden(hidden2) {
  return property("hidden", bool2(hidden2));
}
function view_completed_count(entries_completed) {
  return button(
    toList([
      class$("clear-completed"),
      hidden(entries_completed === 0),
      on_click(new UserClickedClearCompleted())
    ]),
    toList([
      text2("Clear completed ("),
      text2(to_string(entries_completed)),
      text2(")")
    ])
  );
}
function on_enter(msg) {
  return on2(
    "keydown",
    (event2) => {
      return try$(
        field("keyCode", int)(event2),
        (code) => {
          if (code === 13) {
            return new Ok(msg);
          } else {
            return new Error(toList([]));
          }
        }
      );
    }
  );
}
function view_input(value3) {
  return header(
    toList([class$("header")]),
    toList([
      h1(toList([]), toList([text2("todos")])),
      input(
        toList([
          class$("new-todo"),
          placeholder("What needs to be done?"),
          autofocus(true),
          value(value3),
          on_input((var0) => {
            return new UserEditedInput(var0);
          }),
          on_enter(new UserSubmittedInput())
        ])
      )
    ])
  );
}
function on_double_click(msg) {
  return on2("dblclick", (_) => {
    return new Ok(msg);
  });
}
function view_entry(entry) {
  let description = entry.description;
  let completed = entry.completed;
  let editing = entry.editing;
  let id2 = entry.id;
  return li(
    toList([
      classes(
        toList([["completed", completed], ["editing", editing]])
      )
    ]),
    toList([
      div(
        toList([class$("view")]),
        toList([
          input(
            toList([
              class$("toggle"),
              type_("checkbox"),
              checked(completed),
              on_check(
                (_capture) => {
                  return new UserToggledCompleted(id2, _capture);
                }
              )
            ])
          ),
          label(
            toList([on_double_click(new UserToggledEditing(id2, true))]),
            toList([text2(description)])
          ),
          button(
            toList([
              class$("destroy"),
              on_click(new UserClickedDestroy(id2))
            ]),
            toList([])
          )
        ])
      ),
      input(
        toList([
          id("todo-" + to_string(id2)),
          class$("edit"),
          value(description),
          on_input(
            (_capture) => {
              return new UserEditedDescription(id2, _capture);
            }
          ),
          on_blur(new UserToggledEditing(id2, false)),
          on_enter(new UserToggledEditing(id2, false))
        ])
      )
    ])
  );
}
function view_keyed_entry(entry) {
  let html = view_entry(entry);
  return [to_string(entry.id), html];
}
function view_entries(model) {
  let total = model.active + model.completed;
  let css_visibility = (() => {
    let $ = total <= 0;
    if ($) {
      return "hidden";
    } else {
      return "visible";
    }
  })();
  return section(
    toList([
      class$("main"),
      style(toList([["visibility", css_visibility]]))
    ]),
    toList([
      input(
        toList([
          id("toggle-all"),
          class$("toggle-all"),
          type_("checkbox"),
          checked(model.active <= 0),
          on_check(
            (var0) => {
              return new UserToggledAllCompleted(var0);
            }
          )
        ])
      ),
      label(
        toList([for$("toggle-all")]),
        toList([text2("Mark all as complete")])
      ),
      keyed(
        (_capture) => {
          return ul(toList([class$("todo-list")]), _capture);
        },
        fold_right3(
          model.entries,
          toList([]),
          (list2, entry) => {
            let is_visible = (() => {
              let $ = model.visibility;
              if ($ instanceof Completed) {
                return entry.completed && !entry.deleted;
              } else if ($ instanceof Active) {
                return !entry.completed && !entry.deleted;
              } else {
                return !entry.deleted;
              }
            })();
            if (is_visible) {
              return prepend(view_keyed_entry(entry), list2);
            } else {
              return list2;
            }
          }
        )
      )
    ])
  );
}
function view(model) {
  let total = model.active + model.completed;
  return fragment(
    toList([
      view_input(model.input),
      view_entries(model),
      footer(
        toList([class$("footer"), hidden(total <= 0)]),
        toList([
          view_active_count(model.active),
          view_filters(model.visibility),
          view_completed_count(model.completed)
        ])
      )
    ])
  );
}
function focus2(id2) {
  return from((_) => {
    return focus(id2);
  });
}
function update2(model, msg) {
  if (msg instanceof UserEditedInput) {
    let value3 = msg.value;
    return [
      (() => {
        let _record = model;
        return new Model2(
          _record.entries,
          _record.active,
          _record.completed,
          value3,
          _record.uid,
          _record.visibility
        );
      })(),
      none()
    ];
  } else if (msg instanceof UserSubmittedInput) {
    let description = trim(model.input);
    return guard(
      description === "",
      [model, none()],
      () => {
        let entries = append5(
          model.entries,
          new_entry(description, model.uid)
        );
        let uid = model.uid + 1;
        let active = model.active + 1;
        let model$1 = (() => {
          let _record = model;
          return new Model2(
            entries,
            active,
            _record.completed,
            "",
            uid,
            _record.visibility
          );
        })();
        return [model$1, none()];
      }
    );
  } else if (msg instanceof UserChangedVisibility) {
    let visibility = msg.visibility;
    return [
      (() => {
        let _record = model;
        return new Model2(
          _record.entries,
          _record.active,
          _record.completed,
          _record.input,
          _record.uid,
          visibility
        );
      })(),
      none()
    ];
  } else if (msg instanceof UserToggledAllCompleted) {
    let completed = msg.completed;
    let entries = map5(
      model.entries,
      (entry) => {
        let _record = entry;
        return new Entry(
          _record.description,
          completed,
          _record.editing,
          _record.deleted,
          _record.id
        );
      }
    );
    let total = model.completed + model.active;
    let model$1 = (() => {
      if (completed) {
        let _record = model;
        return new Model2(
          entries,
          0,
          total,
          _record.input,
          _record.uid,
          _record.visibility
        );
      } else {
        let _record = model;
        return new Model2(
          entries,
          total,
          0,
          _record.input,
          _record.uid,
          _record.visibility
        );
      }
    })();
    return [model$1, none()];
  } else if (msg instanceof UserClickedClearCompleted) {
    let entries = map5(
      model.entries,
      (entry) => {
        if (entry instanceof Entry && entry.completed) {
          let _record = entry;
          return new Entry(
            _record.description,
            _record.completed,
            _record.editing,
            true,
            _record.id
          );
        } else {
          return entry;
        }
      }
    );
    return [
      (() => {
        let _record = model;
        return new Model2(
          entries,
          _record.active,
          0,
          _record.input,
          _record.uid,
          _record.visibility
        );
      })(),
      none()
    ];
  } else if (msg instanceof UserClickedDestroy) {
    let index3 = msg.index;
    let $ = get2(model.entries, index3);
    if ($.isOk() && !$[0].deleted) {
      let entry = $[0];
      let entries = try_set(
        model.entries,
        index3,
        (() => {
          let _record = entry;
          return new Entry(
            _record.description,
            _record.completed,
            _record.editing,
            true,
            _record.id
          );
        })()
      );
      let model$1 = (() => {
        let $1 = entry.completed;
        if ($1) {
          let _record = model;
          return new Model2(
            entries,
            _record.active,
            model.completed - 1,
            _record.input,
            _record.uid,
            _record.visibility
          );
        } else {
          let _record = model;
          return new Model2(
            entries,
            model.active - 1,
            _record.completed,
            _record.input,
            _record.uid,
            _record.visibility
          );
        }
      })();
      return [model$1, none()];
    } else {
      return [model, none()];
    }
  } else if (msg instanceof UserToggledCompleted) {
    let index3 = msg.index;
    let completed = msg.completed;
    let $ = get2(model.entries, index3);
    if ($.isOk() && $[0].completed !== completed) {
      let entry = $[0];
      let entries = try_set(
        model.entries,
        index3,
        (() => {
          let _record = entry;
          return new Entry(
            _record.description,
            completed,
            _record.editing,
            _record.deleted,
            _record.id
          );
        })()
      );
      let model$1 = (() => {
        if (completed) {
          let active = model.active - 1;
          let completed$1 = model.completed + 1;
          let _record = model;
          return new Model2(
            entries,
            active,
            completed$1,
            _record.input,
            _record.uid,
            _record.visibility
          );
        } else {
          let active = model.active + 1;
          let completed$1 = model.completed - 1;
          let _record = model;
          return new Model2(
            entries,
            active,
            completed$1,
            _record.input,
            _record.uid,
            _record.visibility
          );
        }
      })();
      return [model$1, none()];
    } else {
      return [model, none()];
    }
  } else if (msg instanceof UserToggledEditing && msg.editing) {
    let index3 = msg.index;
    let entries = try_update(
      model.entries,
      index3,
      (entry) => {
        let _record = entry;
        return new Entry(
          _record.description,
          _record.completed,
          true,
          _record.deleted,
          _record.id
        );
      }
    );
    return [
      (() => {
        let _record = model;
        return new Model2(
          entries,
          _record.active,
          _record.completed,
          _record.input,
          _record.uid,
          _record.visibility
        );
      })(),
      focus2("todo-" + to_string(index3))
    ];
  } else if (msg instanceof UserToggledEditing && !msg.editing) {
    let index3 = msg.index;
    let entries = try_update(
      model.entries,
      index3,
      (entry) => {
        let description = trim(entry.description);
        let _record = entry;
        return new Entry(
          description,
          _record.completed,
          false,
          _record.deleted,
          _record.id
        );
      }
    );
    return [
      (() => {
        let _record = model;
        return new Model2(
          entries,
          _record.active,
          _record.completed,
          _record.input,
          _record.uid,
          _record.visibility
        );
      })(),
      none()
    ];
  } else {
    let index3 = msg.index;
    let description = msg.description;
    let entries = try_update(
      model.entries,
      index3,
      (entry) => {
        let _record = entry;
        return new Entry(
          description,
          _record.completed,
          _record.editing,
          _record.deleted,
          _record.id
        );
      }
    );
    return [
      (() => {
        let _record = model;
        return new Model2(
          entries,
          _record.active,
          _record.completed,
          _record.input,
          _record.uid,
          _record.visibility
        );
      })(),
      none()
    ];
  }
}
function main() {
  let app = application(init2, update2, view);
  let $ = start2(app, ".todoapp", void 0);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "todomvc",
      18,
      "main",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  return void 0;
}

// build/.lustre/entry.mjs
main();
