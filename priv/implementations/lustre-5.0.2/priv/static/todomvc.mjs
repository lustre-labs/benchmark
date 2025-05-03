// build/dev/javascript/gleam_stdlib/gleam/bool.mjs
function guard(requirement, consequence, alternative) {
  if (requirement) {
    return consequence;
  } else {
    return alternative();
  }
}

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
function prepend(element4, tail) {
  return new NonEmpty(element4, tail);
}
function toList(elements, tail) {
  return List.fromArray(elements, tail);
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
  byteAt(index4) {
    if (index4 < 0 || index4 >= this.byteSize) {
      return void 0;
    }
    return bitArrayByteAt(this.rawBuffer, this.bitOffset, index4);
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
function bitArrayByteAt(buffer, bitOffset, index4) {
  if (bitOffset === 0) {
    return buffer[index4] ?? 0;
  } else {
    const a2 = buffer[index4] << bitOffset & 255;
    const b = buffer[index4 + 1] >> 8 - bitOffset;
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
  constructor(value2) {
    super();
    this[0] = value2;
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
  let values3 = [x, y];
  while (values3.length) {
    let a2 = values3.pop();
    let b = values3.pop();
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
    let [keys2, get4] = getters(a2);
    for (let k of keys2(a2)) {
      values3.push(get4(a2, k), get4(b, k));
    }
  }
  return true;
}
function getters(object4) {
  if (object4 instanceof Map) {
    return [(x) => x.keys(), (x, y) => x.get(y)];
  } else {
    let extra = object4 instanceof globalThis.Error ? ["message"] : [];
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

// build/dev/javascript/gleam_stdlib/gleam/order.mjs
var Lt = class extends CustomType {
};
var Eq = class extends CustomType {
};
var Gt = class extends CustomType {
};

// build/dev/javascript/gleam_stdlib/gleam/option.mjs
var Some = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var None = class extends CustomType {
};

// build/dev/javascript/gleam_stdlib/gleam/dict.mjs
function insert(dict2, key, value2) {
  return map_insert(key, value2, dict2);
}

// build/dev/javascript/gleam_stdlib/gleam/list.mjs
var Ascending = class extends CustomType {
};
var Descending = class extends CustomType {
};
function reverse_and_prepend(loop$prefix, loop$suffix) {
  while (true) {
    let prefix = loop$prefix;
    let suffix = loop$suffix;
    if (prefix instanceof Empty) {
      return suffix;
    } else {
      let first$1 = prefix.head;
      let rest$1 = prefix.tail;
      loop$prefix = rest$1;
      loop$suffix = prepend(first$1, suffix);
    }
  }
}
function reverse(list4) {
  return reverse_and_prepend(list4, toList([]));
}
function map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list4 instanceof Empty) {
      return reverse(acc);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = prepend(fun(first$1), acc);
    }
  }
}
function map(list4, fun) {
  return map_loop(list4, fun, toList([]));
}
function append_loop(loop$first, loop$second) {
  while (true) {
    let first = loop$first;
    let second = loop$second;
    if (first instanceof Empty) {
      return second;
    } else {
      let first$1 = first.head;
      let rest$1 = first.tail;
      loop$first = rest$1;
      loop$second = prepend(first$1, second);
    }
  }
}
function append(first, second) {
  return append_loop(reverse(first), second);
}
function fold(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list4 = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list4 instanceof Empty) {
      return initial;
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      loop$list = rest$1;
      loop$initial = fun(initial, first$1);
      loop$fun = fun;
    }
  }
}
function sequences(loop$list, loop$compare, loop$growing, loop$direction, loop$prev, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let compare4 = loop$compare;
    let growing = loop$growing;
    let direction = loop$direction;
    let prev = loop$prev;
    let acc = loop$acc;
    let growing$1 = prepend(prev, growing);
    if (list4 instanceof Empty) {
      if (direction instanceof Ascending) {
        return prepend(reverse(growing$1), acc);
      } else {
        return prepend(growing$1, acc);
      }
    } else {
      let new$1 = list4.head;
      let rest$1 = list4.tail;
      let $ = compare4(prev, new$1);
      if (direction instanceof Ascending) {
        if ($ instanceof Lt) {
          loop$list = rest$1;
          loop$compare = compare4;
          loop$growing = growing$1;
          loop$direction = direction;
          loop$prev = new$1;
          loop$acc = acc;
        } else if ($ instanceof Eq) {
          loop$list = rest$1;
          loop$compare = compare4;
          loop$growing = growing$1;
          loop$direction = direction;
          loop$prev = new$1;
          loop$acc = acc;
        } else {
          let _block;
          if (direction instanceof Ascending) {
            _block = prepend(reverse(growing$1), acc);
          } else {
            _block = prepend(growing$1, acc);
          }
          let acc$1 = _block;
          if (rest$1 instanceof Empty) {
            return prepend(toList([new$1]), acc$1);
          } else {
            let next = rest$1.head;
            let rest$2 = rest$1.tail;
            let _block$1;
            let $1 = compare4(new$1, next);
            if ($1 instanceof Lt) {
              _block$1 = new Ascending();
            } else if ($1 instanceof Eq) {
              _block$1 = new Ascending();
            } else {
              _block$1 = new Descending();
            }
            let direction$1 = _block$1;
            loop$list = rest$2;
            loop$compare = compare4;
            loop$growing = toList([new$1]);
            loop$direction = direction$1;
            loop$prev = next;
            loop$acc = acc$1;
          }
        }
      } else {
        if ($ instanceof Lt) {
          let _block;
          if (direction instanceof Ascending) {
            _block = prepend(reverse(growing$1), acc);
          } else {
            _block = prepend(growing$1, acc);
          }
          let acc$1 = _block;
          if (rest$1 instanceof Empty) {
            return prepend(toList([new$1]), acc$1);
          } else {
            let next = rest$1.head;
            let rest$2 = rest$1.tail;
            let _block$1;
            let $1 = compare4(new$1, next);
            if ($1 instanceof Lt) {
              _block$1 = new Ascending();
            } else if ($1 instanceof Eq) {
              _block$1 = new Ascending();
            } else {
              _block$1 = new Descending();
            }
            let direction$1 = _block$1;
            loop$list = rest$2;
            loop$compare = compare4;
            loop$growing = toList([new$1]);
            loop$direction = direction$1;
            loop$prev = next;
            loop$acc = acc$1;
          }
        } else if ($ instanceof Eq) {
          let _block;
          if (direction instanceof Ascending) {
            _block = prepend(reverse(growing$1), acc);
          } else {
            _block = prepend(growing$1, acc);
          }
          let acc$1 = _block;
          if (rest$1 instanceof Empty) {
            return prepend(toList([new$1]), acc$1);
          } else {
            let next = rest$1.head;
            let rest$2 = rest$1.tail;
            let _block$1;
            let $1 = compare4(new$1, next);
            if ($1 instanceof Lt) {
              _block$1 = new Ascending();
            } else if ($1 instanceof Eq) {
              _block$1 = new Ascending();
            } else {
              _block$1 = new Descending();
            }
            let direction$1 = _block$1;
            loop$list = rest$2;
            loop$compare = compare4;
            loop$growing = toList([new$1]);
            loop$direction = direction$1;
            loop$prev = next;
            loop$acc = acc$1;
          }
        } else {
          loop$list = rest$1;
          loop$compare = compare4;
          loop$growing = growing$1;
          loop$direction = direction;
          loop$prev = new$1;
          loop$acc = acc;
        }
      }
    }
  }
}
function merge_ascendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list22 = loop$list2;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (list1 instanceof Empty) {
      let list4 = list22;
      return reverse_and_prepend(list4, acc);
    } else {
      if (list22 instanceof Empty) {
        let list4 = list1;
        return reverse_and_prepend(list4, acc);
      } else {
        let first1 = list1.head;
        let rest1 = list1.tail;
        let first2 = list22.head;
        let rest2 = list22.tail;
        let $ = compare4(first1, first2);
        if ($ instanceof Lt) {
          loop$list1 = rest1;
          loop$list2 = list22;
          loop$compare = compare4;
          loop$acc = prepend(first1, acc);
        } else if ($ instanceof Eq) {
          loop$list1 = list1;
          loop$list2 = rest2;
          loop$compare = compare4;
          loop$acc = prepend(first2, acc);
        } else {
          loop$list1 = list1;
          loop$list2 = rest2;
          loop$compare = compare4;
          loop$acc = prepend(first2, acc);
        }
      }
    }
  }
}
function merge_ascending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (sequences2 instanceof Empty) {
      return reverse(acc);
    } else {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence = sequences2.head;
        return reverse(prepend(reverse(sequence), acc));
      } else {
        let ascending1 = sequences2.head;
        let ascending2 = $.head;
        let rest$1 = $.tail;
        let descending = merge_ascendings(
          ascending1,
          ascending2,
          compare4,
          toList([])
        );
        loop$sequences = rest$1;
        loop$compare = compare4;
        loop$acc = prepend(descending, acc);
      }
    }
  }
}
function merge_descendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list22 = loop$list2;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (list1 instanceof Empty) {
      let list4 = list22;
      return reverse_and_prepend(list4, acc);
    } else {
      if (list22 instanceof Empty) {
        let list4 = list1;
        return reverse_and_prepend(list4, acc);
      } else {
        let first1 = list1.head;
        let rest1 = list1.tail;
        let first2 = list22.head;
        let rest2 = list22.tail;
        let $ = compare4(first1, first2);
        if ($ instanceof Lt) {
          loop$list1 = list1;
          loop$list2 = rest2;
          loop$compare = compare4;
          loop$acc = prepend(first2, acc);
        } else if ($ instanceof Eq) {
          loop$list1 = rest1;
          loop$list2 = list22;
          loop$compare = compare4;
          loop$acc = prepend(first1, acc);
        } else {
          loop$list1 = rest1;
          loop$list2 = list22;
          loop$compare = compare4;
          loop$acc = prepend(first1, acc);
        }
      }
    }
  }
}
function merge_descending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (sequences2 instanceof Empty) {
      return reverse(acc);
    } else {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence = sequences2.head;
        return reverse(prepend(reverse(sequence), acc));
      } else {
        let descending1 = sequences2.head;
        let descending2 = $.head;
        let rest$1 = $.tail;
        let ascending = merge_descendings(
          descending1,
          descending2,
          compare4,
          toList([])
        );
        loop$sequences = rest$1;
        loop$compare = compare4;
        loop$acc = prepend(ascending, acc);
      }
    }
  }
}
function merge_all(loop$sequences, loop$direction, loop$compare) {
  while (true) {
    let sequences2 = loop$sequences;
    let direction = loop$direction;
    let compare4 = loop$compare;
    if (sequences2 instanceof Empty) {
      return toList([]);
    } else {
      if (direction instanceof Ascending) {
        let $ = sequences2.tail;
        if ($ instanceof Empty) {
          let sequence = sequences2.head;
          return sequence;
        } else {
          let sequences$1 = merge_ascending_pairs(
            sequences2,
            compare4,
            toList([])
          );
          loop$sequences = sequences$1;
          loop$direction = new Descending();
          loop$compare = compare4;
        }
      } else {
        let $ = sequences2.tail;
        if ($ instanceof Empty) {
          let sequence = sequences2.head;
          return reverse(sequence);
        } else {
          let sequences$1 = merge_descending_pairs(
            sequences2,
            compare4,
            toList([])
          );
          loop$sequences = sequences$1;
          loop$direction = new Ascending();
          loop$compare = compare4;
        }
      }
    }
  }
}
function sort(list4, compare4) {
  if (list4 instanceof Empty) {
    return toList([]);
  } else {
    let $ = list4.tail;
    if ($ instanceof Empty) {
      let x = list4.head;
      return toList([x]);
    } else {
      let x = list4.head;
      let y = $.head;
      let rest$1 = $.tail;
      let _block;
      let $1 = compare4(x, y);
      if ($1 instanceof Lt) {
        _block = new Ascending();
      } else if ($1 instanceof Eq) {
        _block = new Ascending();
      } else {
        _block = new Descending();
      }
      let direction = _block;
      let sequences$1 = sequences(
        rest$1,
        compare4,
        toList([x]),
        direction,
        y,
        toList([])
      );
      return merge_all(sequences$1, new Ascending(), compare4);
    }
  }
}

// build/dev/javascript/gleam_stdlib/gleam/result.mjs
function is_ok(result) {
  if (result instanceof Ok) {
    return true;
  } else {
    return false;
  }
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
function assoc(root3, shift, hash, key, val, addedLeaf) {
  switch (root3.type) {
    case ARRAY_NODE:
      return assocArray(root3, shift, hash, key, val, addedLeaf);
    case INDEX_NODE:
      return assocIndex(root3, shift, hash, key, val, addedLeaf);
    case COLLISION_NODE:
      return assocCollision(root3, shift, hash, key, val, addedLeaf);
  }
}
function assocArray(root3, shift, hash, key, val, addedLeaf) {
  const idx = mask(hash, shift);
  const node = root3.array[idx];
  if (node === void 0) {
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root3.size + 1,
      array: cloneAndSet(root3.array, idx, { type: ENTRY, k: key, v: val })
    };
  }
  if (node.type === ENTRY) {
    if (isEqual(key, node.k)) {
      if (val === node.v) {
        return root3;
      }
      return {
        type: ARRAY_NODE,
        size: root3.size,
        array: cloneAndSet(root3.array, idx, {
          type: ENTRY,
          k: key,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root3.size,
      array: cloneAndSet(
        root3.array,
        idx,
        createNode(shift + SHIFT, node.k, node.v, hash, key, val)
      )
    };
  }
  const n = assoc(node, shift + SHIFT, hash, key, val, addedLeaf);
  if (n === node) {
    return root3;
  }
  return {
    type: ARRAY_NODE,
    size: root3.size,
    array: cloneAndSet(root3.array, idx, n)
  };
}
function assocIndex(root3, shift, hash, key, val, addedLeaf) {
  const bit = bitpos(hash, shift);
  const idx = index(root3.bitmap, bit);
  if ((root3.bitmap & bit) !== 0) {
    const node = root3.array[idx];
    if (node.type !== ENTRY) {
      const n = assoc(node, shift + SHIFT, hash, key, val, addedLeaf);
      if (n === node) {
        return root3;
      }
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap,
        array: cloneAndSet(root3.array, idx, n)
      };
    }
    const nodeKey = node.k;
    if (isEqual(key, nodeKey)) {
      if (val === node.v) {
        return root3;
      }
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap,
        array: cloneAndSet(root3.array, idx, {
          type: ENTRY,
          k: key,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: INDEX_NODE,
      bitmap: root3.bitmap,
      array: cloneAndSet(
        root3.array,
        idx,
        createNode(shift + SHIFT, nodeKey, node.v, hash, key, val)
      )
    };
  } else {
    const n = root3.array.length;
    if (n >= MAX_INDEX_NODE) {
      const nodes = new Array(32);
      const jdx = mask(hash, shift);
      nodes[jdx] = assocIndex(EMPTY, shift + SHIFT, hash, key, val, addedLeaf);
      let j = 0;
      let bitmap = root3.bitmap;
      for (let i = 0; i < 32; i++) {
        if ((bitmap & 1) !== 0) {
          const node = root3.array[j++];
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
      const newArray = spliceIn(root3.array, idx, {
        type: ENTRY,
        k: key,
        v: val
      });
      addedLeaf.val = true;
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap | bit,
        array: newArray
      };
    }
  }
}
function assocCollision(root3, shift, hash, key, val, addedLeaf) {
  if (hash === root3.hash) {
    const idx = collisionIndexOf(root3, key);
    if (idx !== -1) {
      const entry = root3.array[idx];
      if (entry.v === val) {
        return root3;
      }
      return {
        type: COLLISION_NODE,
        hash,
        array: cloneAndSet(root3.array, idx, { type: ENTRY, k: key, v: val })
      };
    }
    const size3 = root3.array.length;
    addedLeaf.val = true;
    return {
      type: COLLISION_NODE,
      hash,
      array: cloneAndSet(root3.array, size3, { type: ENTRY, k: key, v: val })
    };
  }
  return assoc(
    {
      type: INDEX_NODE,
      bitmap: bitpos(root3.hash, shift),
      array: [root3]
    },
    shift,
    hash,
    key,
    val,
    addedLeaf
  );
}
function collisionIndexOf(root3, key) {
  const size3 = root3.array.length;
  for (let i = 0; i < size3; i++) {
    if (isEqual(key, root3.array[i].k)) {
      return i;
    }
  }
  return -1;
}
function find(root3, shift, hash, key) {
  switch (root3.type) {
    case ARRAY_NODE:
      return findArray(root3, shift, hash, key);
    case INDEX_NODE:
      return findIndex(root3, shift, hash, key);
    case COLLISION_NODE:
      return findCollision(root3, key);
  }
}
function findArray(root3, shift, hash, key) {
  const idx = mask(hash, shift);
  const node = root3.array[idx];
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
function findIndex(root3, shift, hash, key) {
  const bit = bitpos(hash, shift);
  if ((root3.bitmap & bit) === 0) {
    return void 0;
  }
  const idx = index(root3.bitmap, bit);
  const node = root3.array[idx];
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key);
  }
  if (isEqual(key, node.k)) {
    return node;
  }
  return void 0;
}
function findCollision(root3, key) {
  const idx = collisionIndexOf(root3, key);
  if (idx < 0) {
    return void 0;
  }
  return root3.array[idx];
}
function without(root3, shift, hash, key) {
  switch (root3.type) {
    case ARRAY_NODE:
      return withoutArray(root3, shift, hash, key);
    case INDEX_NODE:
      return withoutIndex(root3, shift, hash, key);
    case COLLISION_NODE:
      return withoutCollision(root3, key);
  }
}
function withoutArray(root3, shift, hash, key) {
  const idx = mask(hash, shift);
  const node = root3.array[idx];
  if (node === void 0) {
    return root3;
  }
  let n = void 0;
  if (node.type === ENTRY) {
    if (!isEqual(node.k, key)) {
      return root3;
    }
  } else {
    n = without(node, shift + SHIFT, hash, key);
    if (n === node) {
      return root3;
    }
  }
  if (n === void 0) {
    if (root3.size <= MIN_ARRAY_NODE) {
      const arr = root3.array;
      const out = new Array(root3.size - 1);
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
      size: root3.size - 1,
      array: cloneAndSet(root3.array, idx, n)
    };
  }
  return {
    type: ARRAY_NODE,
    size: root3.size,
    array: cloneAndSet(root3.array, idx, n)
  };
}
function withoutIndex(root3, shift, hash, key) {
  const bit = bitpos(hash, shift);
  if ((root3.bitmap & bit) === 0) {
    return root3;
  }
  const idx = index(root3.bitmap, bit);
  const node = root3.array[idx];
  if (node.type !== ENTRY) {
    const n = without(node, shift + SHIFT, hash, key);
    if (n === node) {
      return root3;
    }
    if (n !== void 0) {
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap,
        array: cloneAndSet(root3.array, idx, n)
      };
    }
    if (root3.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root3.bitmap ^ bit,
      array: spliceOut(root3.array, idx)
    };
  }
  if (isEqual(key, node.k)) {
    if (root3.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root3.bitmap ^ bit,
      array: spliceOut(root3.array, idx)
    };
  }
  return root3;
}
function withoutCollision(root3, key) {
  const idx = collisionIndexOf(root3, key);
  if (idx < 0) {
    return root3;
  }
  if (root3.array.length === 1) {
    return void 0;
  }
  return {
    type: COLLISION_NODE,
    hash: root3.hash,
    array: spliceOut(root3.array, idx)
  };
}
function forEach(root3, fn) {
  if (root3 === void 0) {
    return;
  }
  const items = root3.array;
  const size3 = items.length;
  for (let i = 0; i < size3; i++) {
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
  constructor(root3, size3) {
    this.root = root3;
    this.size = size3;
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
    const root3 = this.root === void 0 ? EMPTY : this.root;
    const newRoot = assoc(root3, 0, getHash(key), key, val, addedLeaf);
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
function starts_with(haystack, needle) {
  return haystack.startsWith(needle);
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
function trim_start(string5) {
  return string5.replace(trim_start_regex, "");
}
function trim_end(string5) {
  return string5.replace(trim_end_regex, "");
}
function new_map() {
  return Dict.new();
}
function map_get(map7, key) {
  const value2 = map7.get(key, NOT_FOUND);
  if (value2 === NOT_FOUND) {
    return new Error(Nil);
  }
  return new Ok(value2);
}
function map_insert(key, value2, map7) {
  return map7.set(key, value2);
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

// build/dev/javascript/gleam_stdlib/gleam/string.mjs
function concat_loop(loop$strings, loop$accumulator) {
  while (true) {
    let strings = loop$strings;
    let accumulator = loop$accumulator;
    if (strings instanceof Empty) {
      return accumulator;
    } else {
      let string5 = strings.head;
      let strings$1 = strings.tail;
      loop$strings = strings$1;
      loop$accumulator = accumulator + string5;
    }
  }
}
function concat2(strings) {
  return concat_loop(strings, "");
}
function trim(string5) {
  let _pipe = string5;
  let _pipe$1 = trim_start(_pipe);
  return trim_end(_pipe$1);
}

// build/dev/javascript/gleam_stdlib/gleam_stdlib_decode_ffi.mjs
function index2(data, key) {
  if (data instanceof Dict || data instanceof WeakMap || data instanceof Map) {
    const token2 = {};
    const entry = data.get(key, token2);
    if (entry === token2) return new Ok(new None());
    return new Ok(new Some(entry));
  }
  const key_is_int = Number.isInteger(key);
  if (key_is_int && key >= 0 && key < 8 && data instanceof List) {
    let i = 0;
    for (const value2 of data) {
      if (i === key) return new Ok(new Some(value2));
      i++;
    }
    return new Error("Indexable");
  }
  if (key_is_int && Array.isArray(data) || data && typeof data === "object" || data && Object.getPrototypeOf(data) === Object.prototype) {
    if (key in data) return new Ok(new Some(data[key]));
    return new Ok(new None());
  }
  return new Error(key_is_int ? "Indexable" : "Dict");
}
function int(data) {
  if (Number.isInteger(data)) return new Ok(data);
  return new Error(0);
}
function string(data) {
  if (typeof data === "string") return new Ok(data);
  return new Error("");
}

// build/dev/javascript/gleam_stdlib/gleam/dynamic/decode.mjs
var DecodeError2 = class extends CustomType {
  constructor(expected, found, path) {
    super();
    this.expected = expected;
    this.found = found;
    this.path = path;
  }
};
var Decoder = class extends CustomType {
  constructor(function$) {
    super();
    this.function = function$;
  }
};
function run(data, decoder) {
  let $ = decoder.function(data);
  let maybe_invalid_data = $[0];
  let errors = $[1];
  if (errors instanceof Empty) {
    return new Ok(maybe_invalid_data);
  } else {
    return new Error(errors);
  }
}
function success(data) {
  return new Decoder((_) => {
    return [data, toList([])];
  });
}
function map3(decoder, transformer) {
  return new Decoder(
    (d) => {
      let $ = decoder.function(d);
      let data = $[0];
      let errors = $[1];
      return [transformer(data), errors];
    }
  );
}
function run_decoders(loop$data, loop$failure, loop$decoders) {
  while (true) {
    let data = loop$data;
    let failure2 = loop$failure;
    let decoders = loop$decoders;
    if (decoders instanceof Empty) {
      return failure2;
    } else {
      let decoder = decoders.head;
      let decoders$1 = decoders.tail;
      let $ = decoder.function(data);
      let layer = $;
      let errors = $[1];
      if (errors instanceof Empty) {
        return layer;
      } else {
        loop$data = data;
        loop$failure = failure2;
        loop$decoders = decoders$1;
      }
    }
  }
}
function one_of(first, alternatives) {
  return new Decoder(
    (dynamic_data) => {
      let $ = first.function(dynamic_data);
      let layer = $;
      let errors = $[1];
      if (errors instanceof Empty) {
        return layer;
      } else {
        return run_decoders(dynamic_data, layer, alternatives);
      }
    }
  );
}
function decode_error(expected, found) {
  return toList([
    new DecodeError2(expected, classify_dynamic(found), toList([]))
  ]);
}
function run_dynamic_function(data, name, f) {
  let $ = f(data);
  if ($ instanceof Ok) {
    let data$1 = $[0];
    return [data$1, toList([])];
  } else {
    let zero = $[0];
    return [
      zero,
      toList([new DecodeError2(name, classify_dynamic(data), toList([]))])
    ];
  }
}
function decode_bool2(data) {
  let $ = isEqual(identity(true), data);
  if ($) {
    return [true, toList([])];
  } else {
    let $1 = isEqual(identity(false), data);
    if ($1) {
      return [false, toList([])];
    } else {
      return [false, decode_error("Bool", data)];
    }
  }
}
function decode_int2(data) {
  return run_dynamic_function(data, "Int", int);
}
function failure(zero, expected) {
  return new Decoder((d) => {
    return [zero, decode_error(expected, d)];
  });
}
var bool = /* @__PURE__ */ new Decoder(decode_bool2);
var int2 = /* @__PURE__ */ new Decoder(decode_int2);
function decode_string2(data) {
  return run_dynamic_function(data, "String", string);
}
var string2 = /* @__PURE__ */ new Decoder(decode_string2);
function push_path(layer, path) {
  let decoder = one_of(
    string2,
    toList([
      (() => {
        let _pipe = int2;
        return map3(_pipe, to_string);
      })()
    ])
  );
  let path$1 = map(
    path,
    (key) => {
      let key$1 = identity(key);
      let $ = run(key$1, decoder);
      if ($ instanceof Ok) {
        let key$2 = $[0];
        return key$2;
      } else {
        return "<" + classify_dynamic(key$1) + ">";
      }
    }
  );
  let errors = map(
    layer[1],
    (error) => {
      let _record = error;
      return new DecodeError2(
        _record.expected,
        _record.found,
        append(path$1, error.path)
      );
    }
  );
  return [layer[0], errors];
}
function index3(loop$path, loop$position, loop$inner, loop$data, loop$handle_miss) {
  while (true) {
    let path = loop$path;
    let position = loop$position;
    let inner = loop$inner;
    let data = loop$data;
    let handle_miss = loop$handle_miss;
    if (path instanceof Empty) {
      let _pipe = inner(data);
      return push_path(_pipe, reverse(position));
    } else {
      let key = path.head;
      let path$1 = path.tail;
      let $ = index2(data, key);
      if ($ instanceof Ok) {
        let $1 = $[0];
        if ($1 instanceof Some) {
          let data$1 = $1[0];
          loop$path = path$1;
          loop$position = prepend(key, position);
          loop$inner = inner;
          loop$data = data$1;
          loop$handle_miss = handle_miss;
        } else {
          return handle_miss(data, prepend(key, position));
        }
      } else {
        let kind = $[0];
        let $1 = inner(data);
        let default$ = $1[0];
        let _pipe = [
          default$,
          toList([new DecodeError2(kind, classify_dynamic(data), toList([]))])
        ];
        return push_path(_pipe, reverse(position));
      }
    }
  }
}
function subfield(field_path, field_decoder, next) {
  return new Decoder(
    (data) => {
      let $ = index3(
        field_path,
        toList([]),
        field_decoder.function,
        data,
        (data2, position) => {
          let $12 = field_decoder.function(data2);
          let default$ = $12[0];
          let _pipe = [
            default$,
            toList([new DecodeError2("Field", "Nothing", toList([]))])
          ];
          return push_path(_pipe, reverse(position));
        }
      );
      let out = $[0];
      let errors1 = $[1];
      let $1 = next(out).function(data);
      let out$1 = $1[0];
      let errors2 = $1[1];
      return [out$1, append(errors1, errors2)];
    }
  );
}
function field(field_name, field_decoder, next) {
  return subfield(toList([field_name]), field_decoder, next);
}

// build/dev/javascript/iv/iv_ffi.mjs
var singleton = (x) => [x];
var pair = (x, y) => [x, y];
var append3 = (xs, x) => [...xs, x];
var prepend2 = (xs, x) => [x, ...xs];
var concat3 = (xs, ys) => [...xs, ...ys];
var get1 = (idx, xs) => xs[idx - 1];
var set1 = (idx, xs, x) => xs.with(idx - 1, x);
var length2 = (xs) => xs.length;
var map4 = (xs, f) => xs.map(f);
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
  constructor(size3, children) {
    super();
    this.size = size3;
    this.children = children;
  }
};
var Unbalanced = class extends CustomType {
  constructor(sizes, children) {
    super();
    this.sizes = sizes;
    this.children = children;
  }
};
var Leaf = class extends CustomType {
  constructor(children) {
    super();
    this.children = children;
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
  } else if (node instanceof Unbalanced) {
    let sizes = node.sizes;
    return get1(length2(sizes), sizes);
  } else {
    let children = node.children;
    return length2(children);
  }
}
function compute_sizes(nodes) {
  let first_size = size(get1(1, nodes));
  return fold_skip_first(
    nodes,
    singleton(first_size),
    (sizes, node) => {
      let size$1 = get1(length2(sizes), sizes) + size(node);
      return append3(sizes, size$1);
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
    let index4 = loop$index;
    let $ = get1(size_idx_plus_one, sizes) > index4;
    if ($) {
      return size_idx_plus_one - 1;
    } else {
      loop$sizes = sizes;
      loop$size_idx_plus_one = size_idx_plus_one + 1;
      loop$index = index4;
    }
  }
}
function map5(node, fun) {
  if (node instanceof Balanced) {
    let size$1 = node.size;
    let children = node.children;
    return new Balanced(
      size$1,
      map4(children, (_capture) => {
        return map5(_capture, fun);
      })
    );
  } else if (node instanceof Unbalanced) {
    let sizes = node.sizes;
    let children = node.children;
    return new Unbalanced(
      sizes,
      map4(children, (_capture) => {
        return map5(_capture, fun);
      })
    );
  } else {
    let children = node.children;
    return new Leaf(map4(children, fun));
  }
}
function fold_right2(node, state, fun) {
  if (node instanceof Balanced) {
    let children = node.children;
    return fold_right(
      children,
      state,
      (state2, node2) => {
        return fold_right2(node2, state2, fun);
      }
    );
  } else if (node instanceof Unbalanced) {
    let children = node.children;
    return fold_right(
      children,
      state,
      (state2, node2) => {
        return fold_right2(node2, state2, fun);
      }
    );
  } else {
    let children = node.children;
    return fold_right(children, state, fun);
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
  let _block;
  if (len === 1) {
    _block = 0;
  } else {
    _block = get1(len - 1, sizes);
  }
  let prefix_size = _block;
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
    let index4 = loop$index;
    if (node instanceof Balanced) {
      let children = node.children;
      let node_index = bsr(index4, shift);
      let index$1 = index4 - bsl(node_index, shift);
      let child = get1(node_index + 1, children);
      loop$node = child;
      loop$shift = shift - branch_bits;
      loop$index = index$1;
    } else if (node instanceof Unbalanced) {
      let sizes = node.sizes;
      let children = node.children;
      let start_search_index = bsr(index4, shift);
      let node_index = find_size(sizes, start_search_index + 1, index4);
      let _block;
      if (node_index === 0) {
        _block = index4;
      } else {
        _block = index4 - get1(node_index, sizes);
      }
      let index$1 = _block;
      let child = get1(node_index + 1, children);
      loop$node = child;
      loop$shift = shift - branch_bits;
      loop$index = index$1;
    } else {
      let children = node.children;
      return get1(index4 + 1, children);
    }
  }
}
function update(shift, node, index4, fun) {
  if (node instanceof Balanced) {
    let size$1 = node.size;
    let children = node.children;
    let node_index = bsr(index4, shift);
    let index$1 = index4 - bsl(node_index, shift);
    let _block;
    let _pipe = get1(node_index + 1, children);
    let _pipe$1 = ((_capture) => {
      return update(shift - branch_bits, _capture, index$1, fun);
    })(_pipe);
    _block = ((_capture) => {
      return set1(node_index + 1, children, _capture);
    })(_pipe$1);
    let new_children = _block;
    return new Balanced(size$1, new_children);
  } else if (node instanceof Unbalanced) {
    let sizes = node.sizes;
    let children = node.children;
    let start_search_index = bsr(index4, shift);
    let node_index = find_size(sizes, start_search_index + 1, index4);
    let _block;
    if (node_index === 0) {
      _block = index4;
    } else {
      _block = index4 - get1(node_index, sizes);
    }
    let index$1 = _block;
    let _block$1;
    let _pipe = get1(node_index + 1, children);
    let _pipe$1 = ((_capture) => {
      return update(shift - branch_bits, _capture, index$1, fun);
    })(_pipe);
    _block$1 = ((_capture) => {
      return set1(node_index + 1, children, _capture);
    })(_pipe$1);
    let new_children = _block$1;
    return new Unbalanced(sizes, new_children);
  } else {
    let children = node.children;
    let new_children = set1(
      index4 + 1,
      children,
      fun(get1(index4 + 1, children))
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
    let children = set1(left_len, left_children, updated);
    return new Concatenated(balanced(left_shift, children));
  } else {
    if (left_len < 32) {
      let node = $.right;
      let children = append3(left_children, node);
      let $1 = size(left_last) === bsl(1, left_shift);
      if ($1) {
        return new Concatenated(balanced(left_shift, children));
      } else {
        return new Concatenated(unbalanced(left_shift, children));
      }
    } else {
      let node = $.right;
      return new NoFreeSlot(left, balanced(left_shift, singleton(node)));
    }
  }
}
function direct_concat(left_shift, left, right_shift, right) {
  if (right instanceof Balanced) {
    if (left instanceof Balanced) {
      if (left_shift > right_shift) {
        let cl = left.children;
        return direct_append_balanced(left_shift, left, cl, right_shift, right);
      } else {
        if (right_shift > left_shift) {
          let cr = right.children;
          return direct_prepend_balanced(
            left_shift,
            left,
            right_shift,
            right,
            cr
          );
        } else {
          let cr = right.children;
          let cl = left.children;
          let $ = length2(cl) + length2(cr) <= branch_factor;
          if ($) {
            let merged = concat3(cl, cr);
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
        }
      }
    } else if (left instanceof Unbalanced) {
      if (left_shift > right_shift) {
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
      } else {
        if (right_shift > left_shift) {
          let cr = right.children;
          return direct_prepend_balanced(
            left_shift,
            left,
            right_shift,
            right,
            cr
          );
        } else {
          let cr = right.children;
          let cl = left.children;
          let $ = length2(cl) + length2(cr) <= branch_factor;
          if ($) {
            let merged = concat3(cl, cr);
            return new Concatenated(unbalanced(left_shift, merged));
          } else {
            return new NoFreeSlot(left, right);
          }
        }
      }
    } else {
      let cr = right.children;
      return direct_prepend_balanced(left_shift, left, right_shift, right, cr);
    }
  } else if (right instanceof Unbalanced) {
    if (left instanceof Balanced) {
      if (left_shift > right_shift) {
        let cl = left.children;
        return direct_append_balanced(left_shift, left, cl, right_shift, right);
      } else {
        if (right_shift > left_shift) {
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
        } else {
          let cr = right.children;
          let cl = left.children;
          let $ = length2(cl) + length2(cr) <= branch_factor;
          if ($) {
            let merged = concat3(cl, cr);
            return new Concatenated(unbalanced(left_shift, merged));
          } else {
            return new NoFreeSlot(left, right);
          }
        }
      }
    } else if (left instanceof Unbalanced) {
      if (left_shift > right_shift) {
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
      } else {
        if (right_shift > left_shift) {
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
        } else {
          let cr = right.children;
          let cl = left.children;
          let $ = length2(cl) + length2(cr) <= branch_factor;
          if ($) {
            let merged = concat3(cl, cr);
            return new Concatenated(unbalanced(left_shift, merged));
          } else {
            return new NoFreeSlot(left, right);
          }
        }
      }
    } else {
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
    }
  } else {
    if (left instanceof Balanced) {
      let cl = left.children;
      return direct_append_balanced(left_shift, left, cl, right_shift, right);
    } else if (left instanceof Unbalanced) {
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
    } else {
      let cr = right.children;
      let cl = left.children;
      let $ = length2(cl) + length2(cr) <= branch_factor;
      if ($) {
        return new Concatenated(new Leaf(concat3(cl, cr)));
      } else {
        return new NoFreeSlot(left, right);
      }
    }
  }
}
function direct_append_unbalanced(left_shift, left, left_children, sizes, right_shift, right) {
  let left_len = length2(left_children);
  let left_last = get1(left_len, left_children);
  let $ = direct_concat(left_shift - branch_bits, left_last, right_shift, right);
  if ($ instanceof Concatenated) {
    let updated = $.merged;
    let children = set1(left_len, left_children, updated);
    let last_size = get1(left_len, sizes) + size(updated);
    let sizes$1 = set1(left_len, sizes, last_size);
    return new Concatenated(new Unbalanced(sizes$1, children));
  } else {
    if (left_len < 32) {
      let node = $.right;
      let children = append3(left_children, node);
      let sizes$1 = append3(
        sizes,
        get1(left_len, sizes) + size(node)
      );
      return new Concatenated(new Unbalanced(sizes$1, children));
    } else {
      let node = $.right;
      return new NoFreeSlot(left, balanced(left_shift, singleton(node)));
    }
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
    let children = set1(1, right_children, updated);
    return new Concatenated(unbalanced(right_shift, children));
  } else {
    if (right_len < 32) {
      let node = $.left;
      let children = prepend2(right_children, node);
      return new Concatenated(unbalanced(right_shift, children));
    } else {
      let node = $.left;
      return new NoFreeSlot(
        balanced(right_shift, singleton(node)),
        right
      );
    }
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
    let children = set1(1, right_children, updated);
    let size_delta = size(updated) - size(right_first);
    let sizes$1 = map4(sizes, (s) => {
      return s + size_delta;
    });
    return new Concatenated(new Unbalanced(sizes$1, children));
  } else {
    if (right_len < 32) {
      let node = $.left;
      let children = prepend2(right_children, node);
      let size$1 = size(node);
      let _block;
      let _pipe = sizes;
      let _pipe$1 = map4(_pipe, (s) => {
        return s + size$1;
      });
      _block = prepend2(_pipe$1, size$1);
      let sizes$1 = _block;
      return new Concatenated(new Unbalanced(sizes$1, children));
    } else {
      let node = $.left;
      return new NoFreeSlot(
        balanced(right_shift, singleton(node)),
        right
      );
    }
  }
}

// build/dev/javascript/iv/iv.mjs
var Empty2 = class extends CustomType {
};
var Array2 = class extends CustomType {
  constructor(shift, root3) {
    super();
    this.shift = shift;
    this.root = root3;
  }
};
function array(shift, nodes) {
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
function get2(array4, index4) {
  if (array4 instanceof Empty2) {
    return new Error(void 0);
  } else {
    let shift = array4.shift;
    let root3 = array4.root;
    let $ = 0 <= index4 && index4 < size(root3);
    if ($) {
      return new Ok(get(root3, shift, index4));
    } else {
      return new Error(void 0);
    }
  }
}
function try_update(array4, index4, fun) {
  if (array4 instanceof Empty2) {
    return array4;
  } else {
    let shift = array4.shift;
    let root3 = array4.root;
    let $ = 0 <= index4 && index4 < size(root3);
    if ($) {
      return new Array2(shift, update(shift, root3, index4, fun));
    } else {
      return array4;
    }
  }
}
function try_set(array4, index4, item) {
  return try_update(array4, index4, (_) => {
    return item;
  });
}
function direct_concat2(left, right) {
  if (left instanceof Empty2) {
    return right;
  } else {
    if (right instanceof Empty2) {
      return left;
    } else {
      let left_shift = left.shift;
      let left$1 = left.root;
      let right_shift = right.shift;
      let right$1 = right.root;
      let _block;
      let $ = left_shift > right_shift;
      if ($) {
        _block = left_shift;
      } else {
        _block = right_shift;
      }
      let shift = _block;
      let $1 = direct_concat(left_shift, left$1, right_shift, right$1);
      if ($1 instanceof Concatenated) {
        let root3 = $1.merged;
        return new Array2(shift, root3);
      } else {
        let left$2 = $1.left;
        let right$2 = $1.right;
        return array(shift, pair(left$2, right$2));
      }
    }
  }
}
function append4(array4, item) {
  return direct_concat2(array4, wrap(item));
}
function map6(array4, fun) {
  if (array4 instanceof Empty2) {
    return new Empty2();
  } else {
    let shift = array4.shift;
    let root3 = array4.root;
    return new Array2(shift, map5(root3, fun));
  }
}
function fold_right3(array4, state, fun) {
  if (array4 instanceof Empty2) {
    return state;
  } else {
    let root3 = array4.root;
    return fold_right2(root3, state, fun);
  }
}

// build/dev/javascript/gleam_stdlib/gleam/function.mjs
function identity2(x) {
  return x;
}

// build/dev/javascript/gleam_json/gleam_json_ffi.mjs
function identity3(x) {
  return x;
}

// build/dev/javascript/gleam_json/gleam/json.mjs
function bool2(input2) {
  return identity3(input2);
}

// build/dev/javascript/gleam_stdlib/gleam/set.mjs
var Set2 = class extends CustomType {
  constructor(dict2) {
    super();
    this.dict = dict2;
  }
};
function new$4() {
  return new Set2(new_map());
}
function contains(set, member) {
  let _pipe = set.dict;
  let _pipe$1 = map_get(_pipe, member);
  return is_ok(_pipe$1);
}
var token = void 0;
function insert2(set, member) {
  return new Set2(insert(set.dict, member, token));
}

// build/dev/javascript/lustre/lustre/internals/constants.ffi.mjs
var EMPTY_DICT = /* @__PURE__ */ Dict.new();
function empty_dict() {
  return EMPTY_DICT;
}
var EMPTY_SET = /* @__PURE__ */ new$4();
function empty_set() {
  return EMPTY_SET;
}
var document2 = globalThis?.document;
var NAMESPACE_HTML = "http://www.w3.org/1999/xhtml";
var ELEMENT_NODE = 1;
var TEXT_NODE = 3;
var DOCUMENT_FRAGMENT_NODE = 11;
var SUPPORTS_MOVE_BEFORE = !!globalThis.HTMLElement?.prototype?.moveBefore;

// build/dev/javascript/lustre/lustre/internals/constants.mjs
var empty_list = /* @__PURE__ */ toList([]);
var option_none = /* @__PURE__ */ new None();

// build/dev/javascript/lustre/lustre/vdom/vattr.ffi.mjs
var GT = /* @__PURE__ */ new Gt();
var LT = /* @__PURE__ */ new Lt();
var EQ = /* @__PURE__ */ new Eq();
function compare3(a2, b) {
  if (a2.name === b.name) {
    return EQ;
  } else if (a2.name < b.name) {
    return LT;
  } else {
    return GT;
  }
}

// build/dev/javascript/lustre/lustre/vdom/vattr.mjs
var Attribute = class extends CustomType {
  constructor(kind, name, value2) {
    super();
    this.kind = kind;
    this.name = name;
    this.value = value2;
  }
};
var Property = class extends CustomType {
  constructor(kind, name, value2) {
    super();
    this.kind = kind;
    this.name = name;
    this.value = value2;
  }
};
var Event2 = class extends CustomType {
  constructor(kind, name, handler, include, prevent_default, stop_propagation, immediate2, limit) {
    super();
    this.kind = kind;
    this.name = name;
    this.handler = handler;
    this.include = include;
    this.prevent_default = prevent_default;
    this.stop_propagation = stop_propagation;
    this.immediate = immediate2;
    this.limit = limit;
  }
};
var NoLimit = class extends CustomType {
  constructor(kind) {
    super();
    this.kind = kind;
  }
};
var Debounce = class extends CustomType {
  constructor(kind, delay) {
    super();
    this.kind = kind;
    this.delay = delay;
  }
};
var Throttle = class extends CustomType {
  constructor(kind, delay) {
    super();
    this.kind = kind;
    this.delay = delay;
  }
};
function limit_equals(a2, b) {
  if (b instanceof NoLimit) {
    if (a2 instanceof NoLimit) {
      return true;
    } else {
      return false;
    }
  } else if (b instanceof Debounce) {
    if (a2 instanceof Debounce) {
      let d2 = b.delay;
      let d1 = a2.delay;
      if (d1 === d2) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  } else {
    if (a2 instanceof Throttle) {
      let d2 = b.delay;
      let d1 = a2.delay;
      if (d1 === d2) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
}
function merge(loop$attributes, loop$merged) {
  while (true) {
    let attributes = loop$attributes;
    let merged = loop$merged;
    if (attributes instanceof Empty) {
      return merged;
    } else {
      let $ = attributes.tail;
      if ($ instanceof Empty) {
        let attribute$1 = attributes.head;
        let rest = $;
        loop$attributes = rest;
        loop$merged = prepend(attribute$1, merged);
      } else {
        let $1 = $.head;
        if ($1 instanceof Attribute) {
          let $2 = $1.name;
          if ($2 === "class") {
            let $3 = attributes.head;
            if ($3 instanceof Attribute) {
              let $4 = $3.name;
              if ($4 === "class") {
                let rest = $.tail;
                let class2 = $1.value;
                let kind = $3.kind;
                let class1 = $3.value;
                let value2 = class1 + " " + class2;
                let attribute$1 = new Attribute(kind, "class", value2);
                loop$attributes = prepend(attribute$1, rest);
                loop$merged = merged;
              } else {
                let attribute$1 = $3;
                let rest = $;
                loop$attributes = rest;
                loop$merged = prepend(attribute$1, merged);
              }
            } else {
              let attribute$1 = $3;
              let rest = $;
              loop$attributes = rest;
              loop$merged = prepend(attribute$1, merged);
            }
          } else if ($2 === "style") {
            let $3 = attributes.head;
            if ($3 instanceof Attribute) {
              let $4 = $3.name;
              if ($4 === "style") {
                let rest = $.tail;
                let style2 = $1.value;
                let kind = $3.kind;
                let style1 = $3.value;
                let value2 = style1 + ";" + style2;
                let attribute$1 = new Attribute(kind, "style", value2);
                loop$attributes = prepend(attribute$1, rest);
                loop$merged = merged;
              } else {
                let attribute$1 = $3;
                let rest = $;
                loop$attributes = rest;
                loop$merged = prepend(attribute$1, merged);
              }
            } else {
              let attribute$1 = $3;
              let rest = $;
              loop$attributes = rest;
              loop$merged = prepend(attribute$1, merged);
            }
          } else {
            let attribute$1 = attributes.head;
            let rest = $;
            loop$attributes = rest;
            loop$merged = prepend(attribute$1, merged);
          }
        } else {
          let attribute$1 = attributes.head;
          let rest = $;
          loop$attributes = rest;
          loop$merged = prepend(attribute$1, merged);
        }
      }
    }
  }
}
function prepare(attributes) {
  if (attributes instanceof Empty) {
    return attributes;
  } else {
    let $ = attributes.tail;
    if ($ instanceof Empty) {
      return attributes;
    } else {
      let _pipe = attributes;
      let _pipe$1 = sort(_pipe, (a2, b) => {
        return compare3(b, a2);
      });
      return merge(_pipe$1, empty_list);
    }
  }
}
var attribute_kind = 0;
function attribute(name, value2) {
  return new Attribute(attribute_kind, name, value2);
}
var property_kind = 1;
function property(name, value2) {
  return new Property(property_kind, name, value2);
}
var event_kind = 2;
function event(name, handler, include, prevent_default, stop_propagation, immediate2, limit) {
  return new Event2(
    event_kind,
    name,
    handler,
    include,
    prevent_default,
    stop_propagation,
    immediate2,
    limit
  );
}
var debounce_kind = 1;
var throttle_kind = 2;

// build/dev/javascript/lustre/lustre/attribute.mjs
function attribute2(name, value2) {
  return attribute(name, value2);
}
function property2(name, value2) {
  return property(name, value2);
}
function boolean_attribute(name, value2) {
  if (value2) {
    return attribute2(name, "");
  } else {
    return property2(name, bool2(false));
  }
}
function autofocus(should_autofocus) {
  return boolean_attribute("autofocus", should_autofocus);
}
function class$(name) {
  return attribute2("class", name);
}
function none() {
  return class$("");
}
function do_classes(loop$names, loop$class) {
  while (true) {
    let names = loop$names;
    let class$2 = loop$class;
    if (names instanceof Empty) {
      return class$2;
    } else {
      let $ = names.head[1];
      if ($) {
        let rest = names.tail;
        let name$1 = names.head[0];
        return class$2 + name$1 + " " + do_classes(rest, class$2);
      } else {
        let rest = names.tail;
        loop$names = rest;
        loop$class = class$2;
      }
    }
  }
}
function classes(names) {
  return class$(do_classes(names, ""));
}
function id(value2) {
  return attribute2("id", value2);
}
function style(property3, value2) {
  if (property3 === "") {
    return class$("");
  } else {
    if (value2 === "") {
      return class$("");
    } else {
      return attribute2("style", property3 + ":" + value2 + ";");
    }
  }
}
function href(url) {
  return attribute2("href", url);
}
function checked(is_checked) {
  return boolean_attribute("checked", is_checked);
}
function for$(id2) {
  return attribute2("for", id2);
}
function placeholder(text4) {
  return attribute2("placeholder", text4);
}
function type_(control_type) {
  return attribute2("type", control_type);
}
function value(control_value) {
  return attribute2("value", control_value);
}

// build/dev/javascript/lustre/lustre/effect.mjs
var Effect = class extends CustomType {
  constructor(synchronous, before_paint2, after_paint) {
    super();
    this.synchronous = synchronous;
    this.before_paint = before_paint2;
    this.after_paint = after_paint;
  }
};
var empty3 = /* @__PURE__ */ new Effect(
  /* @__PURE__ */ toList([]),
  /* @__PURE__ */ toList([]),
  /* @__PURE__ */ toList([])
);
function none2() {
  return empty3;
}
function from(effect) {
  let task = (actions) => {
    let dispatch = actions.dispatch;
    return effect(dispatch);
  };
  let _record = empty3;
  return new Effect(toList([task]), _record.before_paint, _record.after_paint);
}

// build/dev/javascript/lustre/lustre/internals/mutable_map.ffi.mjs
function empty4() {
  return null;
}
function get3(map7, key) {
  const value2 = map7?.get(key);
  if (value2 != null) {
    return new Ok(value2);
  } else {
    return new Error(void 0);
  }
}
function insert3(map7, key, value2) {
  map7 ??= /* @__PURE__ */ new Map();
  map7.set(key, value2);
  return map7;
}
function remove(map7, key) {
  map7?.delete(key);
  return map7;
}

// build/dev/javascript/lustre/lustre/vdom/path.mjs
var Root = class extends CustomType {
};
var Key = class extends CustomType {
  constructor(key, parent) {
    super();
    this.key = key;
    this.parent = parent;
  }
};
var Index = class extends CustomType {
  constructor(index4, parent) {
    super();
    this.index = index4;
    this.parent = parent;
  }
};
function do_matches(loop$path, loop$candidates) {
  while (true) {
    let path = loop$path;
    let candidates = loop$candidates;
    if (candidates instanceof Empty) {
      return false;
    } else {
      let candidate = candidates.head;
      let rest = candidates.tail;
      let $ = starts_with(path, candidate);
      if ($) {
        return true;
      } else {
        loop$path = path;
        loop$candidates = rest;
      }
    }
  }
}
function add2(parent, index4, key) {
  if (key === "") {
    return new Index(index4, parent);
  } else {
    return new Key(key, parent);
  }
}
var root2 = /* @__PURE__ */ new Root();
var separator_index = "\n";
var separator_key = "	";
function do_to_string(loop$path, loop$acc) {
  while (true) {
    let path = loop$path;
    let acc = loop$acc;
    if (path instanceof Root) {
      if (acc instanceof Empty) {
        return "";
      } else {
        let segments = acc.tail;
        return concat2(segments);
      }
    } else if (path instanceof Key) {
      let key = path.key;
      let parent = path.parent;
      loop$path = parent;
      loop$acc = prepend(separator_key, prepend(key, acc));
    } else {
      let index4 = path.index;
      let parent = path.parent;
      loop$path = parent;
      loop$acc = prepend(
        separator_index,
        prepend(to_string(index4), acc)
      );
    }
  }
}
function to_string2(path) {
  return do_to_string(path, toList([]));
}
function matches(path, candidates) {
  if (candidates instanceof Empty) {
    return false;
  } else {
    return do_matches(to_string2(path), candidates);
  }
}
var separator_event = "\f";
function event2(path, event4) {
  return do_to_string(path, toList([separator_event, event4]));
}

// build/dev/javascript/lustre/lustre/vdom/vnode.mjs
var Fragment = class extends CustomType {
  constructor(kind, key, mapper, children, keyed_children, children_count) {
    super();
    this.kind = kind;
    this.key = key;
    this.mapper = mapper;
    this.children = children;
    this.keyed_children = keyed_children;
    this.children_count = children_count;
  }
};
var Element = class extends CustomType {
  constructor(kind, key, mapper, namespace, tag, attributes, children, keyed_children, self_closing, void$) {
    super();
    this.kind = kind;
    this.key = key;
    this.mapper = mapper;
    this.namespace = namespace;
    this.tag = tag;
    this.attributes = attributes;
    this.children = children;
    this.keyed_children = keyed_children;
    this.self_closing = self_closing;
    this.void = void$;
  }
};
var Text = class extends CustomType {
  constructor(kind, key, mapper, content) {
    super();
    this.kind = kind;
    this.key = key;
    this.mapper = mapper;
    this.content = content;
  }
};
var UnsafeInnerHtml = class extends CustomType {
  constructor(kind, key, mapper, namespace, tag, attributes, inner_html) {
    super();
    this.kind = kind;
    this.key = key;
    this.mapper = mapper;
    this.namespace = namespace;
    this.tag = tag;
    this.attributes = attributes;
    this.inner_html = inner_html;
  }
};
function is_void_element(tag, namespace) {
  if (namespace === "") {
    if (tag === "area") {
      return true;
    } else if (tag === "base") {
      return true;
    } else if (tag === "br") {
      return true;
    } else if (tag === "col") {
      return true;
    } else if (tag === "embed") {
      return true;
    } else if (tag === "hr") {
      return true;
    } else if (tag === "img") {
      return true;
    } else if (tag === "input") {
      return true;
    } else if (tag === "link") {
      return true;
    } else if (tag === "meta") {
      return true;
    } else if (tag === "param") {
      return true;
    } else if (tag === "source") {
      return true;
    } else if (tag === "track") {
      return true;
    } else if (tag === "wbr") {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}
function advance(node) {
  if (node instanceof Fragment) {
    let children_count = node.children_count;
    return 1 + children_count;
  } else {
    return 1;
  }
}
var fragment_kind = 0;
function fragment(key, mapper, children, keyed_children, children_count) {
  return new Fragment(
    fragment_kind,
    key,
    mapper,
    children,
    keyed_children,
    children_count
  );
}
var element_kind = 1;
function element(key, mapper, namespace, tag, attributes, children, keyed_children, self_closing, void$) {
  return new Element(
    element_kind,
    key,
    mapper,
    namespace,
    tag,
    prepare(attributes),
    children,
    keyed_children,
    self_closing,
    void$ || is_void_element(tag, namespace)
  );
}
var text_kind = 2;
function text(key, mapper, content) {
  return new Text(text_kind, key, mapper, content);
}
var unsafe_inner_html_kind = 3;
function set_fragment_key(loop$key, loop$children, loop$index, loop$new_children, loop$keyed_children) {
  while (true) {
    let key = loop$key;
    let children = loop$children;
    let index4 = loop$index;
    let new_children = loop$new_children;
    let keyed_children = loop$keyed_children;
    if (children instanceof Empty) {
      return [reverse(new_children), keyed_children];
    } else {
      let $ = children.head;
      if ($ instanceof Fragment) {
        let node = $;
        if (node.key === "") {
          let children$1 = children.tail;
          let child_key = key + "::" + to_string(index4);
          let $1 = set_fragment_key(
            child_key,
            node.children,
            0,
            empty_list,
            empty4()
          );
          let node_children = $1[0];
          let node_keyed_children = $1[1];
          let _block;
          let _record = node;
          _block = new Fragment(
            _record.kind,
            _record.key,
            _record.mapper,
            node_children,
            node_keyed_children,
            _record.children_count
          );
          let new_node = _block;
          let new_children$1 = prepend(new_node, new_children);
          let index$1 = index4 + 1;
          loop$key = key;
          loop$children = children$1;
          loop$index = index$1;
          loop$new_children = new_children$1;
          loop$keyed_children = keyed_children;
        } else {
          let node$1 = $;
          if (node$1.key !== "") {
            let children$1 = children.tail;
            let child_key = key + "::" + node$1.key;
            let keyed_node = to_keyed(child_key, node$1);
            let new_children$1 = prepend(keyed_node, new_children);
            let keyed_children$1 = insert3(
              keyed_children,
              child_key,
              keyed_node
            );
            let index$1 = index4 + 1;
            loop$key = key;
            loop$children = children$1;
            loop$index = index$1;
            loop$new_children = new_children$1;
            loop$keyed_children = keyed_children$1;
          } else {
            let node$2 = $;
            let children$1 = children.tail;
            let new_children$1 = prepend(node$2, new_children);
            let index$1 = index4 + 1;
            loop$key = key;
            loop$children = children$1;
            loop$index = index$1;
            loop$new_children = new_children$1;
            loop$keyed_children = keyed_children;
          }
        }
      } else {
        let node = $;
        if (node.key !== "") {
          let children$1 = children.tail;
          let child_key = key + "::" + node.key;
          let keyed_node = to_keyed(child_key, node);
          let new_children$1 = prepend(keyed_node, new_children);
          let keyed_children$1 = insert3(
            keyed_children,
            child_key,
            keyed_node
          );
          let index$1 = index4 + 1;
          loop$key = key;
          loop$children = children$1;
          loop$index = index$1;
          loop$new_children = new_children$1;
          loop$keyed_children = keyed_children$1;
        } else {
          let node$1 = $;
          let children$1 = children.tail;
          let new_children$1 = prepend(node$1, new_children);
          let index$1 = index4 + 1;
          loop$key = key;
          loop$children = children$1;
          loop$index = index$1;
          loop$new_children = new_children$1;
          loop$keyed_children = keyed_children;
        }
      }
    }
  }
}
function to_keyed(key, node) {
  if (node instanceof Fragment) {
    let children = node.children;
    let $ = set_fragment_key(
      key,
      children,
      0,
      empty_list,
      empty4()
    );
    let children$1 = $[0];
    let keyed_children = $[1];
    let _record = node;
    return new Fragment(
      _record.kind,
      key,
      _record.mapper,
      children$1,
      keyed_children,
      _record.children_count
    );
  } else if (node instanceof Element) {
    let _record = node;
    return new Element(
      _record.kind,
      key,
      _record.mapper,
      _record.namespace,
      _record.tag,
      _record.attributes,
      _record.children,
      _record.keyed_children,
      _record.self_closing,
      _record.void
    );
  } else if (node instanceof Text) {
    let _record = node;
    return new Text(_record.kind, key, _record.mapper, _record.content);
  } else {
    let _record = node;
    return new UnsafeInnerHtml(
      _record.kind,
      key,
      _record.mapper,
      _record.namespace,
      _record.tag,
      _record.attributes,
      _record.inner_html
    );
  }
}

// build/dev/javascript/lustre/lustre/vdom/patch.mjs
var Patch = class extends CustomType {
  constructor(index4, removed, changes, children) {
    super();
    this.index = index4;
    this.removed = removed;
    this.changes = changes;
    this.children = children;
  }
};
var ReplaceText = class extends CustomType {
  constructor(kind, content) {
    super();
    this.kind = kind;
    this.content = content;
  }
};
var ReplaceInnerHtml = class extends CustomType {
  constructor(kind, inner_html) {
    super();
    this.kind = kind;
    this.inner_html = inner_html;
  }
};
var Update = class extends CustomType {
  constructor(kind, added, removed) {
    super();
    this.kind = kind;
    this.added = added;
    this.removed = removed;
  }
};
var Move = class extends CustomType {
  constructor(kind, key, before, count) {
    super();
    this.kind = kind;
    this.key = key;
    this.before = before;
    this.count = count;
  }
};
var RemoveKey = class extends CustomType {
  constructor(kind, key, count) {
    super();
    this.kind = kind;
    this.key = key;
    this.count = count;
  }
};
var Replace = class extends CustomType {
  constructor(kind, from2, count, with$) {
    super();
    this.kind = kind;
    this.from = from2;
    this.count = count;
    this.with = with$;
  }
};
var Insert = class extends CustomType {
  constructor(kind, children, before) {
    super();
    this.kind = kind;
    this.children = children;
    this.before = before;
  }
};
var Remove = class extends CustomType {
  constructor(kind, from2, count) {
    super();
    this.kind = kind;
    this.from = from2;
    this.count = count;
  }
};
function new$7(index4, removed, changes, children) {
  return new Patch(index4, removed, changes, children);
}
var replace_text_kind = 0;
function replace_text(content) {
  return new ReplaceText(replace_text_kind, content);
}
var replace_inner_html_kind = 1;
function replace_inner_html(inner_html) {
  return new ReplaceInnerHtml(replace_inner_html_kind, inner_html);
}
var update_kind = 2;
function update2(added, removed) {
  return new Update(update_kind, added, removed);
}
var move_kind = 3;
function move(key, before, count) {
  return new Move(move_kind, key, before, count);
}
var remove_key_kind = 4;
function remove_key(key, count) {
  return new RemoveKey(remove_key_kind, key, count);
}
var replace_kind = 5;
function replace2(from2, count, with$) {
  return new Replace(replace_kind, from2, count, with$);
}
var insert_kind = 6;
function insert4(children, before) {
  return new Insert(insert_kind, children, before);
}
var remove_kind = 7;
function remove2(from2, count) {
  return new Remove(remove_kind, from2, count);
}

// build/dev/javascript/lustre/lustre/vdom/diff.mjs
var Diff = class extends CustomType {
  constructor(patch, events) {
    super();
    this.patch = patch;
    this.events = events;
  }
};
var AttributeChange = class extends CustomType {
  constructor(added, removed, events) {
    super();
    this.added = added;
    this.removed = removed;
    this.events = events;
  }
};
function is_controlled(events, namespace, tag, path) {
  if (tag === "input") {
    if (namespace === "") {
      return has_dispatched_events(events, path);
    } else {
      return false;
    }
  } else if (tag === "select") {
    if (namespace === "") {
      return has_dispatched_events(events, path);
    } else {
      return false;
    }
  } else if (tag === "textarea") {
    if (namespace === "") {
      return has_dispatched_events(events, path);
    } else {
      return false;
    }
  } else {
    return false;
  }
}
function diff_attributes(loop$controlled, loop$path, loop$mapper, loop$events, loop$old, loop$new, loop$added, loop$removed) {
  while (true) {
    let controlled = loop$controlled;
    let path = loop$path;
    let mapper = loop$mapper;
    let events = loop$events;
    let old = loop$old;
    let new$11 = loop$new;
    let added = loop$added;
    let removed = loop$removed;
    if (new$11 instanceof Empty) {
      if (old instanceof Empty) {
        return new AttributeChange(added, removed, events);
      } else {
        let $ = old.head;
        if ($ instanceof Event2) {
          let prev = $;
          let old$1 = old.tail;
          let name = $.name;
          let removed$1 = prepend(prev, removed);
          let events$1 = remove_event(events, path, name);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events$1;
          loop$old = old$1;
          loop$new = new$11;
          loop$added = added;
          loop$removed = removed$1;
        } else {
          let prev = $;
          let old$1 = old.tail;
          let removed$1 = prepend(prev, removed);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events;
          loop$old = old$1;
          loop$new = new$11;
          loop$added = added;
          loop$removed = removed$1;
        }
      }
    } else {
      if (old instanceof Empty) {
        let $ = new$11.head;
        if ($ instanceof Event2) {
          let next = $;
          let new$1 = new$11.tail;
          let name = $.name;
          let handler = $.handler;
          let added$1 = prepend(next, added);
          let events$1 = add_event(events, mapper, path, name, handler);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events$1;
          loop$old = old;
          loop$new = new$1;
          loop$added = added$1;
          loop$removed = removed;
        } else {
          let next = $;
          let new$1 = new$11.tail;
          let added$1 = prepend(next, added);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events;
          loop$old = old;
          loop$new = new$1;
          loop$added = added$1;
          loop$removed = removed;
        }
      } else {
        let next = new$11.head;
        let remaining_new = new$11.tail;
        let prev = old.head;
        let remaining_old = old.tail;
        let $ = compare3(prev, next);
        if ($ instanceof Lt) {
          if (prev instanceof Event2) {
            let name = prev.name;
            let removed$1 = prepend(prev, removed);
            let events$1 = remove_event(events, path, name);
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events$1;
            loop$old = remaining_old;
            loop$new = new$11;
            loop$added = added;
            loop$removed = removed$1;
          } else {
            let removed$1 = prepend(prev, removed);
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events;
            loop$old = remaining_old;
            loop$new = new$11;
            loop$added = added;
            loop$removed = removed$1;
          }
        } else if ($ instanceof Eq) {
          if (next instanceof Attribute) {
            if (prev instanceof Attribute) {
              let _block;
              let $1 = next.name;
              if ($1 === "value") {
                _block = controlled || prev.value !== next.value;
              } else if ($1 === "checked") {
                _block = controlled || prev.value !== next.value;
              } else if ($1 === "selected") {
                _block = controlled || prev.value !== next.value;
              } else {
                _block = prev.value !== next.value;
              }
              let has_changes = _block;
              let _block$1;
              if (has_changes) {
                _block$1 = prepend(next, added);
              } else {
                _block$1 = added;
              }
              let added$1 = _block$1;
              loop$controlled = controlled;
              loop$path = path;
              loop$mapper = mapper;
              loop$events = events;
              loop$old = remaining_old;
              loop$new = remaining_new;
              loop$added = added$1;
              loop$removed = removed;
            } else if (prev instanceof Event2) {
              let name = prev.name;
              let added$1 = prepend(next, added);
              let removed$1 = prepend(prev, removed);
              let events$1 = remove_event(events, path, name);
              loop$controlled = controlled;
              loop$path = path;
              loop$mapper = mapper;
              loop$events = events$1;
              loop$old = remaining_old;
              loop$new = remaining_new;
              loop$added = added$1;
              loop$removed = removed$1;
            } else {
              let added$1 = prepend(next, added);
              let removed$1 = prepend(prev, removed);
              loop$controlled = controlled;
              loop$path = path;
              loop$mapper = mapper;
              loop$events = events;
              loop$old = remaining_old;
              loop$new = remaining_new;
              loop$added = added$1;
              loop$removed = removed$1;
            }
          } else if (next instanceof Property) {
            if (prev instanceof Property) {
              let _block;
              let $1 = next.name;
              if ($1 === "scrollLeft") {
                _block = true;
              } else if ($1 === "scrollRight") {
                _block = true;
              } else if ($1 === "value") {
                _block = controlled || !isEqual(prev.value, next.value);
              } else if ($1 === "checked") {
                _block = controlled || !isEqual(prev.value, next.value);
              } else if ($1 === "selected") {
                _block = controlled || !isEqual(prev.value, next.value);
              } else {
                _block = !isEqual(prev.value, next.value);
              }
              let has_changes = _block;
              let _block$1;
              if (has_changes) {
                _block$1 = prepend(next, added);
              } else {
                _block$1 = added;
              }
              let added$1 = _block$1;
              loop$controlled = controlled;
              loop$path = path;
              loop$mapper = mapper;
              loop$events = events;
              loop$old = remaining_old;
              loop$new = remaining_new;
              loop$added = added$1;
              loop$removed = removed;
            } else if (prev instanceof Event2) {
              let name = prev.name;
              let added$1 = prepend(next, added);
              let removed$1 = prepend(prev, removed);
              let events$1 = remove_event(events, path, name);
              loop$controlled = controlled;
              loop$path = path;
              loop$mapper = mapper;
              loop$events = events$1;
              loop$old = remaining_old;
              loop$new = remaining_new;
              loop$added = added$1;
              loop$removed = removed$1;
            } else {
              let added$1 = prepend(next, added);
              let removed$1 = prepend(prev, removed);
              loop$controlled = controlled;
              loop$path = path;
              loop$mapper = mapper;
              loop$events = events;
              loop$old = remaining_old;
              loop$new = remaining_new;
              loop$added = added$1;
              loop$removed = removed$1;
            }
          } else {
            if (prev instanceof Event2) {
              let name = next.name;
              let handler = next.handler;
              let has_changes = prev.prevent_default !== next.prevent_default || prev.stop_propagation !== next.stop_propagation || prev.immediate !== next.immediate || !limit_equals(
                prev.limit,
                next.limit
              );
              let _block;
              if (has_changes) {
                _block = prepend(next, added);
              } else {
                _block = added;
              }
              let added$1 = _block;
              let events$1 = add_event(
                events,
                mapper,
                path,
                name,
                handler
              );
              loop$controlled = controlled;
              loop$path = path;
              loop$mapper = mapper;
              loop$events = events$1;
              loop$old = remaining_old;
              loop$new = remaining_new;
              loop$added = added$1;
              loop$removed = removed;
            } else {
              let name = next.name;
              let handler = next.handler;
              let added$1 = prepend(next, added);
              let removed$1 = prepend(prev, removed);
              let events$1 = add_event(
                events,
                mapper,
                path,
                name,
                handler
              );
              loop$controlled = controlled;
              loop$path = path;
              loop$mapper = mapper;
              loop$events = events$1;
              loop$old = remaining_old;
              loop$new = remaining_new;
              loop$added = added$1;
              loop$removed = removed$1;
            }
          }
        } else {
          if (next instanceof Event2) {
            let name = next.name;
            let handler = next.handler;
            let added$1 = prepend(next, added);
            let events$1 = add_event(
              events,
              mapper,
              path,
              name,
              handler
            );
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events$1;
            loop$old = old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed;
          } else {
            let added$1 = prepend(next, added);
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events;
            loop$old = old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed;
          }
        }
      }
    }
  }
}
function do_diff(loop$old, loop$old_keyed, loop$new, loop$new_keyed, loop$moved, loop$moved_offset, loop$removed, loop$node_index, loop$patch_index, loop$path, loop$changes, loop$children, loop$mapper, loop$events) {
  while (true) {
    let old = loop$old;
    let old_keyed = loop$old_keyed;
    let new$11 = loop$new;
    let new_keyed = loop$new_keyed;
    let moved = loop$moved;
    let moved_offset = loop$moved_offset;
    let removed = loop$removed;
    let node_index = loop$node_index;
    let patch_index = loop$patch_index;
    let path = loop$path;
    let changes = loop$changes;
    let children = loop$children;
    let mapper = loop$mapper;
    let events = loop$events;
    if (new$11 instanceof Empty) {
      if (old instanceof Empty) {
        return new Diff(
          new Patch(patch_index, removed, changes, children),
          events
        );
      } else {
        let prev = old.head;
        let old$1 = old.tail;
        let _block;
        let $ = prev.key === "" || !contains(moved, prev.key);
        if ($) {
          _block = removed + advance(prev);
        } else {
          _block = removed;
        }
        let removed$1 = _block;
        let events$1 = remove_child(events, path, node_index, prev);
        loop$old = old$1;
        loop$old_keyed = old_keyed;
        loop$new = new$11;
        loop$new_keyed = new_keyed;
        loop$moved = moved;
        loop$moved_offset = moved_offset;
        loop$removed = removed$1;
        loop$node_index = node_index;
        loop$patch_index = patch_index;
        loop$path = path;
        loop$changes = changes;
        loop$children = children;
        loop$mapper = mapper;
        loop$events = events$1;
      }
    } else {
      if (old instanceof Empty) {
        let events$1 = add_children(
          events,
          mapper,
          path,
          node_index,
          new$11
        );
        let insert5 = insert4(new$11, node_index - moved_offset);
        let changes$1 = prepend(insert5, changes);
        return new Diff(
          new Patch(patch_index, removed, changes$1, children),
          events$1
        );
      } else {
        let next = new$11.head;
        let prev = old.head;
        if (prev.key !== next.key) {
          let new_remaining = new$11.tail;
          let old_remaining = old.tail;
          let next_did_exist = get3(old_keyed, next.key);
          let prev_does_exist = get3(new_keyed, prev.key);
          let prev_has_moved = contains(moved, prev.key);
          if (next_did_exist instanceof Ok) {
            if (prev_does_exist instanceof Ok) {
              if (prev_has_moved) {
                loop$old = old_remaining;
                loop$old_keyed = old_keyed;
                loop$new = new$11;
                loop$new_keyed = new_keyed;
                loop$moved = moved;
                loop$moved_offset = moved_offset - advance(prev);
                loop$removed = removed;
                loop$node_index = node_index;
                loop$patch_index = patch_index;
                loop$path = path;
                loop$changes = changes;
                loop$children = children;
                loop$mapper = mapper;
                loop$events = events;
              } else {
                let match = next_did_exist[0];
                let count = advance(next);
                let before = node_index - moved_offset;
                let move2 = move(next.key, before, count);
                let changes$1 = prepend(move2, changes);
                let moved$1 = insert2(moved, next.key);
                let moved_offset$1 = moved_offset + count;
                loop$old = prepend(match, old);
                loop$old_keyed = old_keyed;
                loop$new = new$11;
                loop$new_keyed = new_keyed;
                loop$moved = moved$1;
                loop$moved_offset = moved_offset$1;
                loop$removed = removed;
                loop$node_index = node_index;
                loop$patch_index = patch_index;
                loop$path = path;
                loop$changes = changes$1;
                loop$children = children;
                loop$mapper = mapper;
                loop$events = events;
              }
            } else {
              let count = advance(prev);
              let moved_offset$1 = moved_offset - count;
              let events$1 = remove_child(
                events,
                path,
                node_index,
                prev
              );
              let remove3 = remove_key(prev.key, count);
              let changes$1 = prepend(remove3, changes);
              loop$old = old_remaining;
              loop$old_keyed = old_keyed;
              loop$new = new$11;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset$1;
              loop$removed = removed;
              loop$node_index = node_index;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = changes$1;
              loop$children = children;
              loop$mapper = mapper;
              loop$events = events$1;
            }
          } else {
            if (prev_does_exist instanceof Ok) {
              let before = node_index - moved_offset;
              let count = advance(next);
              let events$1 = add_child(
                events,
                mapper,
                path,
                node_index,
                next
              );
              let insert5 = insert4(toList([next]), before);
              let changes$1 = prepend(insert5, changes);
              loop$old = old;
              loop$old_keyed = old_keyed;
              loop$new = new_remaining;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset + count;
              loop$removed = removed;
              loop$node_index = node_index + count;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = changes$1;
              loop$children = children;
              loop$mapper = mapper;
              loop$events = events$1;
            } else {
              let prev_count = advance(prev);
              let next_count = advance(next);
              let change = replace2(
                node_index - moved_offset,
                prev_count,
                next
              );
              let _block;
              let _pipe = events;
              let _pipe$1 = remove_child(_pipe, path, node_index, prev);
              _block = add_child(
                _pipe$1,
                mapper,
                path,
                node_index,
                next
              );
              let events$1 = _block;
              loop$old = old_remaining;
              loop$old_keyed = old_keyed;
              loop$new = new_remaining;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset - prev_count + next_count;
              loop$removed = removed;
              loop$node_index = node_index + next_count;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = prepend(change, changes);
              loop$children = children;
              loop$mapper = mapper;
              loop$events = events$1;
            }
          }
        } else {
          let $ = old.head;
          if ($ instanceof Fragment) {
            let $1 = new$11.head;
            if ($1 instanceof Fragment) {
              let next$1 = $1;
              let new$1 = new$11.tail;
              let prev$1 = $;
              let old$1 = old.tail;
              let node_index$1 = node_index + 1;
              let prev_count = prev$1.children_count;
              let next_count = next$1.children_count;
              let composed_mapper = compose_mapper(
                mapper,
                next$1.mapper
              );
              let child = do_diff(
                prev$1.children,
                prev$1.keyed_children,
                next$1.children,
                next$1.keyed_children,
                empty_set(),
                moved_offset,
                0,
                node_index$1,
                -1,
                path,
                empty_list,
                children,
                composed_mapper,
                events
              );
              let _block;
              let $2 = child.patch.removed > 0;
              if ($2) {
                let remove_from = node_index$1 + next_count - moved_offset;
                let patch = remove2(remove_from, child.patch.removed);
                _block = append(
                  child.patch.changes,
                  prepend(patch, changes)
                );
              } else {
                _block = append(child.patch.changes, changes);
              }
              let changes$1 = _block;
              loop$old = old$1;
              loop$old_keyed = old_keyed;
              loop$new = new$1;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset + next_count - prev_count;
              loop$removed = removed;
              loop$node_index = node_index$1 + next_count;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = changes$1;
              loop$children = child.patch.children;
              loop$mapper = mapper;
              loop$events = child.events;
            } else {
              let next$1 = $1;
              let new_remaining = new$11.tail;
              let prev$1 = $;
              let old_remaining = old.tail;
              let prev_count = advance(prev$1);
              let next_count = advance(next$1);
              let change = replace2(
                node_index - moved_offset,
                prev_count,
                next$1
              );
              let _block;
              let _pipe = events;
              let _pipe$1 = remove_child(
                _pipe,
                path,
                node_index,
                prev$1
              );
              _block = add_child(
                _pipe$1,
                mapper,
                path,
                node_index,
                next$1
              );
              let events$1 = _block;
              loop$old = old_remaining;
              loop$old_keyed = old_keyed;
              loop$new = new_remaining;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset - prev_count + next_count;
              loop$removed = removed;
              loop$node_index = node_index + next_count;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = prepend(change, changes);
              loop$children = children;
              loop$mapper = mapper;
              loop$events = events$1;
            }
          } else if ($ instanceof Element) {
            let $1 = new$11.head;
            if ($1 instanceof Element) {
              let next$1 = $1;
              let prev$1 = $;
              if (prev$1.namespace === next$1.namespace && prev$1.tag === next$1.tag) {
                let new$1 = new$11.tail;
                let old$1 = old.tail;
                let composed_mapper = compose_mapper(
                  mapper,
                  next$1.mapper
                );
                let child_path = add2(path, node_index, next$1.key);
                let controlled = is_controlled(
                  events,
                  next$1.namespace,
                  next$1.tag,
                  child_path
                );
                let $2 = diff_attributes(
                  controlled,
                  child_path,
                  composed_mapper,
                  events,
                  prev$1.attributes,
                  next$1.attributes,
                  empty_list,
                  empty_list
                );
                let added_attrs = $2.added;
                let removed_attrs = $2.removed;
                let events$1 = $2.events;
                let _block;
                if (removed_attrs instanceof Empty) {
                  if (added_attrs instanceof Empty) {
                    _block = empty_list;
                  } else {
                    _block = toList([update2(added_attrs, removed_attrs)]);
                  }
                } else {
                  _block = toList([update2(added_attrs, removed_attrs)]);
                }
                let initial_child_changes = _block;
                let child = do_diff(
                  prev$1.children,
                  prev$1.keyed_children,
                  next$1.children,
                  next$1.keyed_children,
                  empty_set(),
                  0,
                  0,
                  0,
                  node_index,
                  child_path,
                  initial_child_changes,
                  empty_list,
                  composed_mapper,
                  events$1
                );
                let _block$1;
                let $3 = child.patch;
                let $4 = $3.children;
                if ($4 instanceof Empty) {
                  let $5 = $3.changes;
                  if ($5 instanceof Empty) {
                    let $6 = $3.removed;
                    if ($6 === 0) {
                      _block$1 = children;
                    } else {
                      _block$1 = prepend(child.patch, children);
                    }
                  } else {
                    _block$1 = prepend(child.patch, children);
                  }
                } else {
                  _block$1 = prepend(child.patch, children);
                }
                let children$1 = _block$1;
                loop$old = old$1;
                loop$old_keyed = old_keyed;
                loop$new = new$1;
                loop$new_keyed = new_keyed;
                loop$moved = moved;
                loop$moved_offset = moved_offset;
                loop$removed = removed;
                loop$node_index = node_index + 1;
                loop$patch_index = patch_index;
                loop$path = path;
                loop$changes = changes;
                loop$children = children$1;
                loop$mapper = mapper;
                loop$events = child.events;
              } else {
                let next$2 = $1;
                let new_remaining = new$11.tail;
                let prev$2 = $;
                let old_remaining = old.tail;
                let prev_count = advance(prev$2);
                let next_count = advance(next$2);
                let change = replace2(
                  node_index - moved_offset,
                  prev_count,
                  next$2
                );
                let _block;
                let _pipe = events;
                let _pipe$1 = remove_child(
                  _pipe,
                  path,
                  node_index,
                  prev$2
                );
                _block = add_child(
                  _pipe$1,
                  mapper,
                  path,
                  node_index,
                  next$2
                );
                let events$1 = _block;
                loop$old = old_remaining;
                loop$old_keyed = old_keyed;
                loop$new = new_remaining;
                loop$new_keyed = new_keyed;
                loop$moved = moved;
                loop$moved_offset = moved_offset - prev_count + next_count;
                loop$removed = removed;
                loop$node_index = node_index + next_count;
                loop$patch_index = patch_index;
                loop$path = path;
                loop$changes = prepend(change, changes);
                loop$children = children;
                loop$mapper = mapper;
                loop$events = events$1;
              }
            } else {
              let next$1 = $1;
              let new_remaining = new$11.tail;
              let prev$1 = $;
              let old_remaining = old.tail;
              let prev_count = advance(prev$1);
              let next_count = advance(next$1);
              let change = replace2(
                node_index - moved_offset,
                prev_count,
                next$1
              );
              let _block;
              let _pipe = events;
              let _pipe$1 = remove_child(
                _pipe,
                path,
                node_index,
                prev$1
              );
              _block = add_child(
                _pipe$1,
                mapper,
                path,
                node_index,
                next$1
              );
              let events$1 = _block;
              loop$old = old_remaining;
              loop$old_keyed = old_keyed;
              loop$new = new_remaining;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset - prev_count + next_count;
              loop$removed = removed;
              loop$node_index = node_index + next_count;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = prepend(change, changes);
              loop$children = children;
              loop$mapper = mapper;
              loop$events = events$1;
            }
          } else if ($ instanceof Text) {
            let $1 = new$11.head;
            if ($1 instanceof Text) {
              let next$1 = $1;
              let prev$1 = $;
              if (prev$1.content === next$1.content) {
                let new$1 = new$11.tail;
                let old$1 = old.tail;
                loop$old = old$1;
                loop$old_keyed = old_keyed;
                loop$new = new$1;
                loop$new_keyed = new_keyed;
                loop$moved = moved;
                loop$moved_offset = moved_offset;
                loop$removed = removed;
                loop$node_index = node_index + 1;
                loop$patch_index = patch_index;
                loop$path = path;
                loop$changes = changes;
                loop$children = children;
                loop$mapper = mapper;
                loop$events = events;
              } else {
                let next$2 = $1;
                let new$1 = new$11.tail;
                let old$1 = old.tail;
                let child = new$7(
                  node_index,
                  0,
                  toList([replace_text(next$2.content)]),
                  empty_list
                );
                loop$old = old$1;
                loop$old_keyed = old_keyed;
                loop$new = new$1;
                loop$new_keyed = new_keyed;
                loop$moved = moved;
                loop$moved_offset = moved_offset;
                loop$removed = removed;
                loop$node_index = node_index + 1;
                loop$patch_index = patch_index;
                loop$path = path;
                loop$changes = changes;
                loop$children = prepend(child, children);
                loop$mapper = mapper;
                loop$events = events;
              }
            } else {
              let next$1 = $1;
              let new_remaining = new$11.tail;
              let prev$1 = $;
              let old_remaining = old.tail;
              let prev_count = advance(prev$1);
              let next_count = advance(next$1);
              let change = replace2(
                node_index - moved_offset,
                prev_count,
                next$1
              );
              let _block;
              let _pipe = events;
              let _pipe$1 = remove_child(
                _pipe,
                path,
                node_index,
                prev$1
              );
              _block = add_child(
                _pipe$1,
                mapper,
                path,
                node_index,
                next$1
              );
              let events$1 = _block;
              loop$old = old_remaining;
              loop$old_keyed = old_keyed;
              loop$new = new_remaining;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset - prev_count + next_count;
              loop$removed = removed;
              loop$node_index = node_index + next_count;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = prepend(change, changes);
              loop$children = children;
              loop$mapper = mapper;
              loop$events = events$1;
            }
          } else {
            let $1 = new$11.head;
            if ($1 instanceof UnsafeInnerHtml) {
              let next$1 = $1;
              let new$1 = new$11.tail;
              let prev$1 = $;
              let old$1 = old.tail;
              let composed_mapper = compose_mapper(
                mapper,
                next$1.mapper
              );
              let child_path = add2(path, node_index, next$1.key);
              let $2 = diff_attributes(
                false,
                child_path,
                composed_mapper,
                events,
                prev$1.attributes,
                next$1.attributes,
                empty_list,
                empty_list
              );
              let added_attrs = $2.added;
              let removed_attrs = $2.removed;
              let events$1 = $2.events;
              let _block;
              if (removed_attrs instanceof Empty) {
                if (added_attrs instanceof Empty) {
                  _block = empty_list;
                } else {
                  _block = toList([update2(added_attrs, removed_attrs)]);
                }
              } else {
                _block = toList([update2(added_attrs, removed_attrs)]);
              }
              let child_changes = _block;
              let _block$1;
              let $3 = prev$1.inner_html === next$1.inner_html;
              if ($3) {
                _block$1 = child_changes;
              } else {
                _block$1 = prepend(
                  replace_inner_html(next$1.inner_html),
                  child_changes
                );
              }
              let child_changes$1 = _block$1;
              let _block$2;
              if (child_changes$1 instanceof Empty) {
                _block$2 = children;
              } else {
                _block$2 = prepend(
                  new$7(node_index, 0, child_changes$1, toList([])),
                  children
                );
              }
              let children$1 = _block$2;
              loop$old = old$1;
              loop$old_keyed = old_keyed;
              loop$new = new$1;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = changes;
              loop$children = children$1;
              loop$mapper = mapper;
              loop$events = events$1;
            } else {
              let next$1 = $1;
              let new_remaining = new$11.tail;
              let prev$1 = $;
              let old_remaining = old.tail;
              let prev_count = advance(prev$1);
              let next_count = advance(next$1);
              let change = replace2(
                node_index - moved_offset,
                prev_count,
                next$1
              );
              let _block;
              let _pipe = events;
              let _pipe$1 = remove_child(
                _pipe,
                path,
                node_index,
                prev$1
              );
              _block = add_child(
                _pipe$1,
                mapper,
                path,
                node_index,
                next$1
              );
              let events$1 = _block;
              loop$old = old_remaining;
              loop$old_keyed = old_keyed;
              loop$new = new_remaining;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset - prev_count + next_count;
              loop$removed = removed;
              loop$node_index = node_index + next_count;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = prepend(change, changes);
              loop$children = children;
              loop$mapper = mapper;
              loop$events = events$1;
            }
          }
        }
      }
    }
  }
}
function diff(events, old, new$11) {
  return do_diff(
    toList([old]),
    empty4(),
    toList([new$11]),
    empty4(),
    empty_set(),
    0,
    0,
    0,
    0,
    root2,
    empty_list,
    empty_list,
    identity2,
    tick(events)
  );
}

// build/dev/javascript/lustre/lustre/vdom/reconciler.ffi.mjs
var Reconciler = class {
  offset = 0;
  #root = null;
  #dispatch = () => {
  };
  #useServerEvents = false;
  constructor(root3, dispatch, { useServerEvents = false } = {}) {
    this.#root = root3;
    this.#dispatch = dispatch;
    this.#useServerEvents = useServerEvents;
  }
  mount(vdom) {
    appendChild(this.#root, this.#createElement(vdom));
  }
  #stack = [];
  push(patch) {
    const offset = this.offset;
    if (offset) {
      iterate(patch.changes, (change) => {
        switch (change.kind) {
          case insert_kind:
          case move_kind:
            change.before = (change.before | 0) + offset;
            break;
          case remove_kind:
          case replace_kind:
            change.from = (change.from | 0) + offset;
            break;
        }
      });
      iterate(patch.children, (child) => {
        child.index = (child.index | 0) + offset;
      });
    }
    this.#stack.push({ node: this.#root, patch });
    this.#reconcile();
  }
  // PATCHING ------------------------------------------------------------------
  #reconcile() {
    const self = this;
    while (self.#stack.length) {
      const { node, patch } = self.#stack.pop();
      iterate(patch.changes, (change) => {
        switch (change.kind) {
          case insert_kind:
            self.#insert(node, change.children, change.before);
            break;
          case move_kind:
            self.#move(node, change.key, change.before, change.count);
            break;
          case remove_key_kind:
            self.#removeKey(node, change.key, change.count);
            break;
          case remove_kind:
            self.#remove(node, change.from, change.count);
            break;
          case replace_kind:
            self.#replace(node, change.from, change.count, change.with);
            break;
          case replace_text_kind:
            self.#replaceText(node, change.content);
            break;
          case replace_inner_html_kind:
            self.#replaceInnerHtml(node, change.inner_html);
            break;
          case update_kind:
            self.#update(node, change.added, change.removed);
            break;
        }
      });
      if (patch.removed) {
        self.#remove(
          node,
          node.childNodes.length - patch.removed,
          patch.removed
        );
      }
      iterate(patch.children, (child) => {
        self.#stack.push({ node: childAt(node, child.index), patch: child });
      });
    }
  }
  // CHANGES -------------------------------------------------------------------
  #insert(node, children, before) {
    const fragment3 = createDocumentFragment();
    iterate(children, (child) => {
      const el = this.#createElement(child);
      addKeyedChild(node, el);
      appendChild(fragment3, el);
    });
    insertBefore(node, fragment3, childAt(node, before));
  }
  #move(node, key, before, count) {
    let el = getKeyedChild(node, key);
    const beforeEl = childAt(node, before);
    for (let i = 0; i < count && el !== null; ++i) {
      const next = el.nextSibling;
      if (SUPPORTS_MOVE_BEFORE) {
        node.moveBefore(el, beforeEl);
      } else {
        insertBefore(node, el, beforeEl);
      }
      el = next;
    }
  }
  #removeKey(node, key, count) {
    this.#removeFromChild(node, getKeyedChild(node, key), count);
  }
  #remove(node, from2, count) {
    this.#removeFromChild(node, childAt(node, from2), count);
  }
  #removeFromChild(parent, child, count) {
    while (count-- > 0 && child !== null) {
      const next = child.nextSibling;
      const key = child[meta].key;
      if (key) {
        parent[meta].keyedChildren.delete(key);
      }
      for (const [_, { timeout }] of child[meta].debouncers) {
        clearTimeout(timeout);
      }
      parent.removeChild(child);
      child = next;
    }
  }
  #replace(parent, from2, count, child) {
    this.#remove(parent, from2, count);
    const el = this.#createElement(child);
    addKeyedChild(parent, el);
    insertBefore(parent, el, childAt(parent, from2));
  }
  #replaceText(node, content) {
    node.data = content ?? "";
  }
  #replaceInnerHtml(node, inner_html) {
    node.innerHTML = inner_html ?? "";
  }
  #update(node, added, removed) {
    iterate(removed, (attribute3) => {
      const name = attribute3.name;
      if (node[meta].handlers.has(name)) {
        node.removeEventListener(name, handleEvent);
        node[meta].handlers.delete(name);
        if (node[meta].throttles.has(name)) {
          node[meta].throttles.delete(name);
        }
        if (node[meta].debouncers.has(name)) {
          clearTimeout(node[meta].debouncers.get(name).timeout);
          node[meta].debouncers.delete(name);
        }
      } else {
        node.removeAttribute(name);
        ATTRIBUTE_HOOKS[name]?.removed?.(node, name);
      }
    });
    iterate(added, (attribute3) => {
      this.#createAttribute(node, attribute3);
    });
  }
  // CONSTRUCTORS --------------------------------------------------------------
  #createElement(vnode) {
    switch (vnode.kind) {
      case element_kind: {
        const node = createElement(vnode);
        this.#createAttributes(node, vnode);
        this.#insert(node, vnode.children, 0);
        return node;
      }
      case text_kind: {
        const node = createTextNode(vnode.content);
        initialiseMetadata(node, vnode.key);
        return node;
      }
      case fragment_kind: {
        const node = createDocumentFragment();
        const head = createTextNode();
        initialiseMetadata(head, vnode.key);
        appendChild(node, head);
        iterate(vnode.children, (child) => {
          appendChild(node, this.#createElement(child));
        });
        return node;
      }
      case unsafe_inner_html_kind: {
        const node = createElement(vnode);
        this.#createAttributes(node, vnode);
        this.#replaceInnerHtml(node, vnode.inner_html);
        return node;
      }
    }
  }
  #createAttributes(node, { attributes }) {
    iterate(attributes, (attribute3) => this.#createAttribute(node, attribute3));
  }
  #createAttribute(node, attribute3) {
    const nodeMeta = node[meta];
    switch (attribute3.kind) {
      case attribute_kind: {
        const name = attribute3.name;
        const value2 = attribute3.value ?? "";
        if (value2 !== node.getAttribute(name)) {
          node.setAttribute(name, value2);
        }
        ATTRIBUTE_HOOKS[name]?.added?.(node, value2);
        break;
      }
      case property_kind:
        node[attribute3.name] = attribute3.value;
        break;
      case event_kind: {
        if (!nodeMeta.handlers.has(attribute3.name)) {
          node.addEventListener(attribute3.name, handleEvent, {
            passive: !attribute3.prevent_default
          });
        }
        const prevent = attribute3.prevent_default;
        const stop = attribute3.stop_propagation;
        const immediate2 = attribute3.immediate;
        const include = Array.isArray(attribute3.include) ? attribute3.include : [];
        if (attribute3.limit?.kind === throttle_kind) {
          const throttle = nodeMeta.throttles.get(attribute3.name) ?? {
            last: 0,
            delay: attribute3.limit.delay
          };
          nodeMeta.throttles.set(attribute3.name, throttle);
        }
        if (attribute3.limit?.kind === debounce_kind) {
          const debounce = nodeMeta.debouncers.get(attribute3.name) ?? {
            timeout: null,
            delay: attribute3.limit.delay
          };
          nodeMeta.debouncers.set(attribute3.name, debounce);
        }
        nodeMeta.handlers.set(attribute3.name, (event4) => {
          if (prevent) event4.preventDefault();
          if (stop) event4.stopPropagation();
          const type = event4.type;
          let path = "";
          let pathNode = event4.currentTarget;
          while (pathNode !== this.#root) {
            const key = pathNode[meta].key;
            const parent = pathNode.parentNode;
            if (key) {
              path = `${separator_key}${key}${path}`;
            } else {
              const siblings = parent.childNodes;
              let index4 = [].indexOf.call(siblings, pathNode);
              if (parent === this.#root) {
                index4 -= this.offset;
              }
              path = `${separator_index}${index4}${path}`;
            }
            pathNode = parent;
          }
          path = path.slice(1);
          const data = this.#useServerEvents ? createServerEvent(event4, include) : event4;
          if (nodeMeta.throttles.has(type)) {
            const throttle = nodeMeta.throttles.get(type);
            const now = Date.now();
            const last = throttle.last || 0;
            if (now > last + throttle.delay) {
              throttle.last = now;
              this.#dispatch(data, path, type, immediate2);
            } else {
              event4.preventDefault();
            }
          } else if (nodeMeta.debouncers.has(type)) {
            const debounce = nodeMeta.debouncers.get(type);
            clearTimeout(debounce.timeout);
            debounce.timeout = setTimeout(() => {
              this.#dispatch(data, path, type, immediate2);
            }, debounce.delay);
          } else {
            this.#dispatch(data, path, type, immediate2);
          }
        });
        break;
      }
    }
  }
};
var iterate = (list4, callback) => {
  if (Array.isArray(list4)) {
    for (let i = 0; i < list4.length; i++) {
      callback(list4[i]);
    }
  } else if (list4) {
    for (list4; list4.tail; list4 = list4.tail) {
      callback(list4.head);
    }
  }
};
var appendChild = (node, child) => node.appendChild(child);
var insertBefore = (parent, node, referenceNode) => parent.insertBefore(node, referenceNode ?? null);
var createElement = ({ key, tag, namespace }) => {
  const node = document2.createElementNS(namespace || NAMESPACE_HTML, tag);
  initialiseMetadata(node, key);
  return node;
};
var createTextNode = (text4) => document2.createTextNode(text4 ?? "");
var createDocumentFragment = () => document2.createDocumentFragment();
var childAt = (node, at) => node.childNodes[at | 0];
var meta = Symbol("lustre");
var initialiseMetadata = (node, key = "") => {
  switch (node.nodeType) {
    case ELEMENT_NODE:
    case DOCUMENT_FRAGMENT_NODE:
      node[meta] = {
        key,
        keyedChildren: /* @__PURE__ */ new Map(),
        handlers: /* @__PURE__ */ new Map(),
        throttles: /* @__PURE__ */ new Map(),
        debouncers: /* @__PURE__ */ new Map()
      };
      break;
    case TEXT_NODE:
      node[meta] = { key, debouncers: /* @__PURE__ */ new Map() };
      break;
  }
};
var addKeyedChild = (node, child) => {
  if (child.nodeType === DOCUMENT_FRAGMENT_NODE) {
    for (child = child.firstChild; child; child = child.nextSibling) {
      addKeyedChild(node, child);
    }
    return;
  }
  const key = child[meta].key;
  if (key) {
    node[meta].keyedChildren.set(key, new WeakRef(child));
  }
};
var getKeyedChild = (node, key) => node[meta].keyedChildren.get(key).deref();
var handleEvent = (event4) => {
  const target = event4.currentTarget;
  const handler = target[meta].handlers.get(event4.type);
  if (event4.type === "submit") {
    event4.detail ??= {};
    event4.detail.formData = [...new FormData(event4.target).entries()];
  }
  handler(event4);
};
var createServerEvent = (event4, include = []) => {
  const data = {};
  if (event4.type === "input" || event4.type === "change") {
    include.push("target.value");
  }
  if (event4.type === "submit") {
    include.push("detail.formData");
  }
  for (const property3 of include) {
    const path = property3.split(".");
    for (let i = 0, input2 = event4, output = data; i < path.length; i++) {
      if (i === path.length - 1) {
        output[path[i]] = input2[path[i]];
        break;
      }
      output = output[path[i]] ??= {};
      input2 = input2[path[i]];
    }
  }
  return data;
};
var syncedBooleanAttribute = (name) => {
  return {
    added(node) {
      node[name] = true;
    },
    removed(node) {
      node[name] = false;
    }
  };
};
var syncedAttribute = (name) => {
  return {
    added(node, value2) {
      node[name] = value2;
    }
  };
};
var ATTRIBUTE_HOOKS = {
  checked: syncedBooleanAttribute("checked"),
  selected: syncedBooleanAttribute("selected"),
  value: syncedAttribute("value"),
  autofocus: {
    added(node) {
      queueMicrotask(() => node.focus?.());
    }
  },
  autoplay: {
    added(node) {
      try {
        node.play?.();
      } catch (e) {
        console.error(e);
      }
    }
  }
};

// build/dev/javascript/lustre/lustre/vdom/virtualise.ffi.mjs
var virtualise = (root3) => {
  const vdom = virtualise_node(root3);
  if (vdom === null || vdom.children instanceof Empty) {
    const empty5 = empty_text_node();
    initialiseMetadata(empty5);
    root3.appendChild(empty5);
    return none3();
  } else if (vdom.children instanceof NonEmpty && vdom.children.tail instanceof Empty) {
    return vdom.children.head;
  } else {
    const head = empty_text_node();
    initialiseMetadata(head);
    root3.insertBefore(head, root3.firstChild);
    return fragment2(vdom.children);
  }
};
var empty_text_node = () => {
  return document2.createTextNode("");
};
var virtualise_node = (node) => {
  switch (node.nodeType) {
    case ELEMENT_NODE: {
      const key = node.getAttribute("data-lustre-key");
      initialiseMetadata(node, key);
      if (key) {
        node.removeAttribute("data-lustre-key");
      }
      const tag = node.localName;
      const namespace = node.namespaceURI;
      const isHtmlElement = !namespace || namespace === NAMESPACE_HTML;
      if (isHtmlElement && input_elements.includes(tag)) {
        virtualise_input_events(tag, node);
      }
      const attributes = virtualise_attributes(node);
      const children = virtualise_child_nodes(node);
      const vnode = isHtmlElement ? element2(tag, attributes, children) : namespaced(namespace, tag, attributes, children);
      return key ? to_keyed(key, vnode) : vnode;
    }
    case TEXT_NODE:
      initialiseMetadata(node);
      return text2(node.data);
    case DOCUMENT_FRAGMENT_NODE:
      initialiseMetadata(node);
      return node.childNodes.length > 0 ? fragment2(virtualise_child_nodes(node)) : null;
    default:
      return null;
  }
};
var input_elements = ["input", "select", "textarea"];
var virtualise_input_events = (tag, node) => {
  const value2 = node.value;
  const checked2 = node.checked;
  if (tag === "input" && node.type === "checkbox" && !checked2) return;
  if (tag === "input" && node.type === "radio" && !checked2) return;
  if (node.type !== "checkbox" && node.type !== "radio" && !value2) return;
  queueMicrotask(() => {
    node.value = value2;
    node.checked = checked2;
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
    if (document2.activeElement !== node) {
      node.dispatchEvent(new Event("blur", { bubbles: true }));
    }
  });
};
var virtualise_child_nodes = (node) => {
  let children = empty_list;
  let child = node.lastChild;
  while (child) {
    const vnode = virtualise_node(child);
    const next = child.previousSibling;
    if (vnode) {
      children = new NonEmpty(vnode, children);
    } else {
      node.removeChild(child);
    }
    child = next;
  }
  return children;
};
var virtualise_attributes = (node) => {
  let index4 = node.attributes.length;
  let attributes = empty_list;
  while (index4-- > 0) {
    attributes = new NonEmpty(
      virtualise_attribute(node.attributes[index4]),
      attributes
    );
  }
  return attributes;
};
var virtualise_attribute = (attr) => {
  const name = attr.localName;
  const value2 = attr.value;
  return attribute2(name, value2);
};

// build/dev/javascript/lustre/lustre/runtime/client/runtime.ffi.mjs
var is_browser = () => !!document2;
var is_reference_equal = (a2, b) => a2 === b;
var Runtime = class {
  constructor(root3, [model, effects], view2, update4) {
    this.root = root3;
    this.#model = model;
    this.#view = view2;
    this.#update = update4;
    this.#reconciler = new Reconciler(this.root, (event4, path, name) => {
      const [events, msg] = handle(this.#events, path, name, event4);
      this.#events = events;
      if (msg.isOk()) {
        this.dispatch(msg[0], false);
      }
    });
    this.#vdom = virtualise(this.root);
    this.#events = new$8();
    this.#shouldFlush = true;
    this.#tick(effects);
  }
  // PUBLIC API ----------------------------------------------------------------
  root = null;
  set offset(offset) {
    this.#reconciler.offset = offset;
  }
  dispatch(msg, immediate2 = false) {
    this.#shouldFlush ||= immediate2;
    if (this.#shouldQueue) {
      this.#queue.push(msg);
    } else {
      const [model, effects] = this.#update(this.#model, msg);
      this.#model = model;
      this.#tick(effects);
    }
  }
  emit(event4, data) {
    const target = this.root.host ?? this.root;
    target.dispatchEvent(
      new CustomEvent(event4, {
        detail: data,
        bubbles: true,
        composed: true
      })
    );
  }
  // PRIVATE API ---------------------------------------------------------------
  #model;
  #view;
  #update;
  #vdom;
  #events;
  #reconciler;
  #shouldQueue = false;
  #queue = [];
  #beforePaint = empty_list;
  #afterPaint = empty_list;
  #renderTimer = null;
  #shouldFlush = false;
  #actions = {
    dispatch: (msg, immediate2) => this.dispatch(msg, immediate2),
    emit: (event4, data) => this.emit(event4, data),
    select: () => {
    },
    root: () => this.root
  };
  // A `#tick` is where we process effects and trigger any synchronous updates.
  // Once a tick has been processed a render will be scheduled if none is already.
  // p0
  #tick(effects) {
    this.#shouldQueue = true;
    while (true) {
      for (let list4 = effects.synchronous; list4.tail; list4 = list4.tail) {
        list4.head(this.#actions);
      }
      this.#beforePaint = listAppend(this.#beforePaint, effects.before_paint);
      this.#afterPaint = listAppend(this.#afterPaint, effects.after_paint);
      if (!this.#queue.length) break;
      [this.#model, effects] = this.#update(this.#model, this.#queue.shift());
    }
    this.#shouldQueue = false;
    if (this.#shouldFlush) {
      cancelAnimationFrame(this.#renderTimer);
      this.#render();
    } else if (!this.#renderTimer) {
      this.#renderTimer = requestAnimationFrame(() => {
        this.#render();
      });
    }
  }
  #render() {
    this.#shouldFlush = false;
    this.#renderTimer = null;
    const next = this.#view(this.#model);
    const { patch, events } = diff(this.#events, this.#vdom, next);
    this.#events = events;
    this.#vdom = next;
    this.#reconciler.push(patch);
    if (this.#beforePaint instanceof NonEmpty) {
      const effects = makeEffect(this.#beforePaint);
      this.#beforePaint = empty_list;
      queueMicrotask(() => {
        this.#shouldFlush = true;
        this.#tick(effects);
      });
    }
    if (this.#afterPaint instanceof NonEmpty) {
      const effects = makeEffect(this.#afterPaint);
      this.#afterPaint = empty_list;
      requestAnimationFrame(() => {
        this.#shouldFlush = true;
        this.#tick(effects);
      });
    }
  }
};
function makeEffect(synchronous) {
  return {
    synchronous,
    after_paint: empty_list,
    before_paint: empty_list
  };
}
function listAppend(a2, b) {
  if (a2 instanceof Empty) {
    return b;
  } else if (b instanceof Empty) {
    return a2;
  } else {
    return append(a2, b);
  }
}

// build/dev/javascript/lustre/lustre/vdom/events.mjs
var Events = class extends CustomType {
  constructor(handlers, dispatched_paths, next_dispatched_paths) {
    super();
    this.handlers = handlers;
    this.dispatched_paths = dispatched_paths;
    this.next_dispatched_paths = next_dispatched_paths;
  }
};
function new$8() {
  return new Events(
    empty4(),
    empty_list,
    empty_list
  );
}
function tick(events) {
  return new Events(
    events.handlers,
    events.next_dispatched_paths,
    empty_list
  );
}
function do_remove_event(handlers, path, name) {
  return remove(handlers, event2(path, name));
}
function remove_event(events, path, name) {
  let handlers = do_remove_event(events.handlers, path, name);
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}
function remove_attributes(handlers, path, attributes) {
  return fold(
    attributes,
    handlers,
    (events, attribute3) => {
      if (attribute3 instanceof Event2) {
        let name = attribute3.name;
        return do_remove_event(events, path, name);
      } else {
        return events;
      }
    }
  );
}
function handle(events, path, name, event4) {
  let next_dispatched_paths = prepend(path, events.next_dispatched_paths);
  let _block;
  let _record = events;
  _block = new Events(
    _record.handlers,
    _record.dispatched_paths,
    next_dispatched_paths
  );
  let events$1 = _block;
  let $ = get3(
    events$1.handlers,
    path + separator_event + name
  );
  if ($ instanceof Ok) {
    let handler = $[0];
    return [events$1, run(event4, handler)];
  } else {
    return [events$1, new Error(toList([]))];
  }
}
function has_dispatched_events(events, path) {
  return matches(path, events.dispatched_paths);
}
function do_add_event(handlers, mapper, path, name, handler) {
  return insert3(
    handlers,
    event2(path, name),
    map3(handler, identity2(mapper))
  );
}
function add_event(events, mapper, path, name, handler) {
  let handlers = do_add_event(events.handlers, mapper, path, name, handler);
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}
function add_attributes(handlers, mapper, path, attributes) {
  return fold(
    attributes,
    handlers,
    (events, attribute3) => {
      if (attribute3 instanceof Event2) {
        let name = attribute3.name;
        let handler = attribute3.handler;
        return do_add_event(events, mapper, path, name, handler);
      } else {
        return events;
      }
    }
  );
}
function compose_mapper(mapper, child_mapper) {
  let $ = is_reference_equal(mapper, identity2);
  let $1 = is_reference_equal(child_mapper, identity2);
  if ($1) {
    return mapper;
  } else {
    if ($) {
      return child_mapper;
    } else {
      return (msg) => {
        return mapper(child_mapper(msg));
      };
    }
  }
}
function do_remove_children(loop$handlers, loop$path, loop$child_index, loop$children) {
  while (true) {
    let handlers = loop$handlers;
    let path = loop$path;
    let child_index = loop$child_index;
    let children = loop$children;
    if (children instanceof Empty) {
      return handlers;
    } else {
      let child = children.head;
      let rest = children.tail;
      let _pipe = handlers;
      let _pipe$1 = do_remove_child(_pipe, path, child_index, child);
      loop$handlers = _pipe$1;
      loop$path = path;
      loop$child_index = child_index + advance(child);
      loop$children = rest;
    }
  }
}
function do_remove_child(handlers, parent, child_index, child) {
  if (child instanceof Fragment) {
    let children = child.children;
    return do_remove_children(handlers, parent, child_index + 1, children);
  } else if (child instanceof Element) {
    let attributes = child.attributes;
    let children = child.children;
    let path = add2(parent, child_index, child.key);
    let _pipe = handlers;
    let _pipe$1 = remove_attributes(_pipe, path, attributes);
    return do_remove_children(_pipe$1, path, 0, children);
  } else if (child instanceof Text) {
    return handlers;
  } else {
    let attributes = child.attributes;
    let path = add2(parent, child_index, child.key);
    return remove_attributes(handlers, path, attributes);
  }
}
function remove_child(events, parent, child_index, child) {
  let handlers = do_remove_child(events.handlers, parent, child_index, child);
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}
function do_add_children(loop$handlers, loop$mapper, loop$path, loop$child_index, loop$children) {
  while (true) {
    let handlers = loop$handlers;
    let mapper = loop$mapper;
    let path = loop$path;
    let child_index = loop$child_index;
    let children = loop$children;
    if (children instanceof Empty) {
      return handlers;
    } else {
      let child = children.head;
      let rest = children.tail;
      let _pipe = handlers;
      let _pipe$1 = do_add_child(_pipe, mapper, path, child_index, child);
      loop$handlers = _pipe$1;
      loop$mapper = mapper;
      loop$path = path;
      loop$child_index = child_index + advance(child);
      loop$children = rest;
    }
  }
}
function do_add_child(handlers, mapper, parent, child_index, child) {
  if (child instanceof Fragment) {
    let children = child.children;
    let composed_mapper = compose_mapper(mapper, child.mapper);
    let child_index$1 = child_index + 1;
    return do_add_children(
      handlers,
      composed_mapper,
      parent,
      child_index$1,
      children
    );
  } else if (child instanceof Element) {
    let attributes = child.attributes;
    let children = child.children;
    let path = add2(parent, child_index, child.key);
    let composed_mapper = compose_mapper(mapper, child.mapper);
    let _pipe = handlers;
    let _pipe$1 = add_attributes(_pipe, composed_mapper, path, attributes);
    return do_add_children(_pipe$1, composed_mapper, path, 0, children);
  } else if (child instanceof Text) {
    return handlers;
  } else {
    let attributes = child.attributes;
    let path = add2(parent, child_index, child.key);
    let composed_mapper = compose_mapper(mapper, child.mapper);
    return add_attributes(handlers, composed_mapper, path, attributes);
  }
}
function add_child(events, mapper, parent, index4, child) {
  let handlers = do_add_child(events.handlers, mapper, parent, index4, child);
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}
function add_children(events, mapper, path, child_index, children) {
  let handlers = do_add_children(
    events.handlers,
    mapper,
    path,
    child_index,
    children
  );
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}

// build/dev/javascript/lustre/lustre/element.mjs
function element2(tag, attributes, children) {
  return element(
    "",
    identity2,
    "",
    tag,
    attributes,
    children,
    empty4(),
    false,
    false
  );
}
function namespaced(namespace, tag, attributes, children) {
  return element(
    "",
    identity2,
    namespace,
    tag,
    attributes,
    children,
    empty4(),
    false,
    false
  );
}
function text2(content) {
  return text("", identity2, content);
}
function none3() {
  return text("", identity2, "");
}
function count_fragment_children(loop$children, loop$count) {
  while (true) {
    let children = loop$children;
    let count = loop$count;
    if (children instanceof Empty) {
      return count;
    } else {
      let $ = children.head;
      if ($ instanceof Fragment) {
        let rest = children.tail;
        let children_count = $.children_count;
        loop$children = rest;
        loop$count = count + children_count;
      } else {
        let rest = children.tail;
        loop$children = rest;
        loop$count = count + 1;
      }
    }
  }
}
function fragment2(children) {
  return fragment(
    "",
    identity2,
    children,
    empty4(),
    count_fragment_children(children, 0)
  );
}

// build/dev/javascript/lustre/lustre/element/html.mjs
function text3(content) {
  return text2(content);
}
function footer(attrs, children) {
  return element2("footer", attrs, children);
}
function header(attrs, children) {
  return element2("header", attrs, children);
}
function h1(attrs, children) {
  return element2("h1", attrs, children);
}
function section(attrs, children) {
  return element2("section", attrs, children);
}
function div(attrs, children) {
  return element2("div", attrs, children);
}
function li(attrs, children) {
  return element2("li", attrs, children);
}
function ul(attrs, children) {
  return element2("ul", attrs, children);
}
function a(attrs, children) {
  return element2("a", attrs, children);
}
function span(attrs, children) {
  return element2("span", attrs, children);
}
function strong(attrs, children) {
  return element2("strong", attrs, children);
}
function button(attrs, children) {
  return element2("button", attrs, children);
}
function input(attrs) {
  return element2("input", attrs, empty_list);
}
function label(attrs, children) {
  return element2("label", attrs, children);
}

// build/dev/javascript/lustre/lustre/runtime/server/runtime.mjs
var EffectDispatchedMessage = class extends CustomType {
  constructor(message) {
    super();
    this.message = message;
  }
};
var EffectEmitEvent = class extends CustomType {
  constructor(name, data) {
    super();
    this.name = name;
    this.data = data;
  }
};
var SystemRequestedShutdown = class extends CustomType {
};

// build/dev/javascript/lustre/lustre/component.mjs
var Config2 = class extends CustomType {
  constructor(open_shadow_root, adopt_styles, attributes, properties, is_form_associated, on_form_autofill, on_form_reset, on_form_restore) {
    super();
    this.open_shadow_root = open_shadow_root;
    this.adopt_styles = adopt_styles;
    this.attributes = attributes;
    this.properties = properties;
    this.is_form_associated = is_form_associated;
    this.on_form_autofill = on_form_autofill;
    this.on_form_reset = on_form_reset;
    this.on_form_restore = on_form_restore;
  }
};
function new$9(options) {
  let init2 = new Config2(
    false,
    true,
    empty_dict(),
    empty_dict(),
    false,
    option_none,
    option_none,
    option_none
  );
  return fold(
    options,
    init2,
    (config, option) => {
      return option.apply(config);
    }
  );
}

// build/dev/javascript/lustre/lustre/runtime/client/spa.ffi.mjs
var Spa = class _Spa {
  static start({ init: init2, update: update4, view: view2 }, selector, flags) {
    if (!is_browser()) return new Error(new NotABrowser());
    const root3 = selector instanceof HTMLElement ? selector : document2.querySelector(selector);
    if (!root3) return new Error(new ElementNotFound(selector));
    return new Ok(new _Spa(root3, init2(flags), update4, view2));
  }
  #runtime;
  constructor(root3, [init2, effects], update4, view2) {
    this.#runtime = new Runtime(root3, [init2, effects], view2, update4);
  }
  send(message) {
    switch (message.constructor) {
      case EffectDispatchedMessage: {
        this.dispatch(message.message, false);
        break;
      }
      case EffectEmitEvent: {
        this.emit(message.name, message.data);
        break;
      }
      case SystemRequestedShutdown:
        break;
    }
  }
  dispatch(msg, immediate2) {
    this.#runtime.dispatch(msg, immediate2);
  }
  emit(event4, data) {
    this.#runtime.emit(event4, data);
  }
};
var start = Spa.start;

// build/dev/javascript/lustre/lustre.mjs
var App = class extends CustomType {
  constructor(init2, update4, view2, config) {
    super();
    this.init = init2;
    this.update = update4;
    this.view = view2;
    this.config = config;
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
function application(init2, update4, view2) {
  return new App(init2, update4, view2, new$9(empty_list));
}
function start3(app, selector, start_args) {
  return guard(
    !is_browser(),
    new Error(new NotABrowser()),
    () => {
      return start(app, selector, start_args);
    }
  );
}

// build/dev/javascript/lustre/lustre/element/keyed.mjs
function extract_keyed_children(children) {
  let init2 = [empty4(), empty_list, 0];
  let $ = fold(
    children,
    init2,
    (_use0, _use1) => {
      let keyed_children2 = _use0[0];
      let children$12 = _use0[1];
      let children_count2 = _use0[2];
      let key = _use1[0];
      let element$1 = _use1[1];
      let keyed_element = to_keyed(key, element$1);
      let _block;
      if (key === "") {
        _block = keyed_children2;
      } else {
        _block = insert3(keyed_children2, key, keyed_element);
      }
      let keyed_children$1 = _block;
      return [
        keyed_children$1,
        prepend(keyed_element, children$12),
        children_count2 + 1
      ];
    }
  );
  let keyed_children = $[0];
  let children$1 = $[1];
  let children_count = $[2];
  return [keyed_children, reverse(children$1), children_count];
}
function element3(tag, attributes, children) {
  let $ = extract_keyed_children(children);
  let keyed_children = $[0];
  let children$1 = $[1];
  return element(
    "",
    identity2,
    "",
    tag,
    attributes,
    children$1,
    keyed_children,
    false,
    false
  );
}
function ul2(attributes, children) {
  return element3("ul", attributes, children);
}

// build/dev/javascript/lustre/lustre/event.mjs
function is_immediate_event(name) {
  if (name === "input") {
    return true;
  } else if (name === "change") {
    return true;
  } else if (name === "focus") {
    return true;
  } else if (name === "focusin") {
    return true;
  } else if (name === "focusout") {
    return true;
  } else if (name === "blur") {
    return true;
  } else if (name === "select") {
    return true;
  } else {
    return false;
  }
}
function on(name, handler) {
  return event(
    name,
    handler,
    empty_list,
    false,
    false,
    is_immediate_event(name),
    new NoLimit(0)
  );
}
function on_click(msg) {
  return on("click", success(msg));
}
function on_input(msg) {
  return on(
    "input",
    subfield(
      toList(["target", "value"]),
      string2,
      (value2) => {
        return success(msg(value2));
      }
    )
  );
}
function on_check(msg) {
  return on(
    "change",
    subfield(
      toList(["target", "checked"]),
      bool,
      (checked2) => {
        return success(msg(checked2));
      }
    )
  );
}
function on_blur(msg) {
  return on("blur", success(msg));
}

// build/dev/javascript/todomvc/todomvc.ffi.mjs
var clear = (id2) => {
  const el = document.getElementById(id2);
  if (el) el.value = "";
};

// build/dev/javascript/todomvc/todomvc.mjs
var Model = class extends CustomType {
  constructor(entries, active, completed, uid, visibility) {
    super();
    this.entries = entries;
    this.active = active;
    this.completed = completed;
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
var UserSubmittedInput = class extends CustomType {
  constructor(value2) {
    super();
    this.value = value2;
  }
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
  constructor(index4) {
    super();
    this.index = index4;
  }
};
var UserToggledCompleted = class extends CustomType {
  constructor(index4, completed) {
    super();
    this.index = index4;
    this.completed = completed;
  }
};
var UserToggledEditing = class extends CustomType {
  constructor(index4, editing) {
    super();
    this.index = index4;
    this.editing = editing;
  }
};
var UserEditedDescription = class extends CustomType {
  constructor(index4, description) {
    super();
    this.index = index4;
    this.description = description;
  }
};
function new_entry(description, id2) {
  return new Entry(description, false, false, false, id2);
}
function init(_) {
  let model = new Model(new$3(), 0, 0, 0, new All());
  return [model, none2()];
}
function view_active_count(entries_left) {
  let _block;
  if (entries_left === 1) {
    _block = "item";
  } else {
    _block = "items";
  }
  let item = _block;
  return span(
    toList([class$("todo-count")]),
    toList([
      strong(
        toList([]),
        toList([text3(to_string(entries_left))])
      ),
      text3(" "),
      text3(item),
      text3(" left")
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
              return text3("All");
            } else if (visibility instanceof Active) {
              return text3("Active");
            } else {
              return text3("Completed");
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
  if (hidden2) {
    return style("display", "none");
  } else {
    return none();
  }
}
function view_completed_count(entries_completed) {
  return button(
    toList([
      class$("clear-completed"),
      hidden(entries_completed === 0),
      on_click(new UserClickedClearCompleted())
    ]),
    toList([
      text3("Clear completed ("),
      text3(to_string(entries_completed)),
      text3(")")
    ])
  );
}
function on_enter(to_msg) {
  return on(
    "keydown",
    field(
      "keyCode",
      int2,
      (code) => {
        return subfield(
          toList(["target", "value"]),
          string2,
          (value2) => {
            if (code === 13) {
              return success(to_msg(value2));
            } else {
              return failure(to_msg(value2), "not enter");
            }
          }
        );
      }
    )
  );
}
function view_input() {
  return header(
    toList([class$("header")]),
    toList([
      h1(toList([]), toList([text3("todos")])),
      input(
        toList([
          id("new-todo"),
          class$("new-todo"),
          placeholder("What needs to be done?"),
          autofocus(true),
          on_enter((var0) => {
            return new UserSubmittedInput(var0);
          })
        ])
      )
    ])
  );
}
function on_double_click(msg) {
  return on("dblclick", success(msg));
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
      (() => {
        let $ = entry.editing;
        if ($) {
          return input(
            toList([
              class$("edit"),
              value(description),
              autofocus(true),
              on_input(
                (_capture) => {
                  return new UserEditedDescription(id2, _capture);
                }
              ),
              on_blur(new UserToggledEditing(id2, false)),
              on_enter((_) => {
                return new UserToggledEditing(id2, false);
              })
            ])
          );
        } else {
          return div(
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
                toList([text3(description)])
              ),
              button(
                toList([
                  class$("destroy"),
                  on_click(new UserClickedDestroy(id2))
                ]),
                toList([])
              )
            ])
          );
        }
      })()
    ])
  );
}
function view_entries(model) {
  let total = model.active + model.completed;
  return section(
    toList([class$("main"), hidden(total <= 0)]),
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
        toList([text3("Mark all as complete")])
      ),
      ul2(
        toList([class$("todo-list")]),
        fold_right3(
          model.entries,
          toList([]),
          (list4, entry) => {
            let _block;
            let $ = model.visibility;
            if ($ instanceof Active) {
              _block = !entry.completed && !entry.deleted;
            } else if ($ instanceof Completed) {
              _block = entry.completed && !entry.deleted;
            } else {
              _block = !entry.deleted;
            }
            let is_visible = _block;
            if (is_visible) {
              return prepend(
                [to_string(entry.id), view_entry(entry)],
                list4
              );
            } else {
              return list4;
            }
          }
        )
      )
    ])
  );
}
function view(model) {
  let total = model.active + model.completed;
  return fragment2(
    toList([
      view_input(),
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
function clear_input(id2) {
  return from((_) => {
    return clear(id2);
  });
}
function update3(model, msg) {
  if (msg instanceof UserSubmittedInput) {
    let value2 = msg.value;
    let description = trim(value2);
    return guard(
      description === "",
      [model, none2()],
      () => {
        let entries = append4(
          model.entries,
          new_entry(description, model.uid)
        );
        let uid = model.uid + 1;
        let active = model.active + 1;
        let _block;
        let _record = model;
        _block = new Model(
          entries,
          active,
          _record.completed,
          uid,
          _record.visibility
        );
        let model$1 = _block;
        return [model$1, clear_input("new-todo")];
      }
    );
  } else if (msg instanceof UserClickedClearCompleted) {
    let entries = map6(
      model.entries,
      (entry) => {
        let $ = entry.completed;
        if ($) {
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
        return new Model(
          entries,
          _record.active,
          0,
          _record.uid,
          _record.visibility
        );
      })(),
      none2()
    ];
  } else if (msg instanceof UserToggledAllCompleted) {
    let completed = msg.completed;
    let entries = map6(
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
    let _block;
    if (completed) {
      let _record = model;
      _block = new Model(entries, 0, total, _record.uid, _record.visibility);
    } else {
      let _record = model;
      _block = new Model(entries, total, 0, _record.uid, _record.visibility);
    }
    let model$1 = _block;
    return [model$1, none2()];
  } else if (msg instanceof UserChangedVisibility) {
    let visibility = msg.visibility;
    return [
      (() => {
        let _record = model;
        return new Model(
          _record.entries,
          _record.active,
          _record.completed,
          _record.uid,
          visibility
        );
      })(),
      none2()
    ];
  } else if (msg instanceof UserClickedDestroy) {
    let index4 = msg.index;
    let $ = get2(model.entries, index4);
    if ($ instanceof Ok) {
      let entry = $[0];
      if (!entry.deleted) {
        let entries = try_set(
          model.entries,
          index4,
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
        let _block;
        let $1 = entry.completed;
        if ($1) {
          let _record = model;
          _block = new Model(
            entries,
            _record.active,
            model.completed - 1,
            _record.uid,
            _record.visibility
          );
        } else {
          let _record = model;
          _block = new Model(
            entries,
            model.active - 1,
            _record.completed,
            _record.uid,
            _record.visibility
          );
        }
        let model$1 = _block;
        return [model$1, none2()];
      } else {
        return [model, none2()];
      }
    } else {
      return [model, none2()];
    }
  } else if (msg instanceof UserToggledCompleted) {
    let index4 = msg.index;
    let completed = msg.completed;
    let $ = get2(model.entries, index4);
    if ($ instanceof Ok) {
      let entry = $[0];
      if (entry.completed !== completed) {
        let entries = try_set(
          model.entries,
          index4,
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
        let _block;
        if (completed) {
          let active = model.active - 1;
          let completed$1 = model.completed + 1;
          let _record = model;
          _block = new Model(
            entries,
            active,
            completed$1,
            _record.uid,
            _record.visibility
          );
        } else {
          let active = model.active + 1;
          let completed$1 = model.completed - 1;
          let _record = model;
          _block = new Model(
            entries,
            active,
            completed$1,
            _record.uid,
            _record.visibility
          );
        }
        let model$1 = _block;
        return [model$1, none2()];
      } else {
        return [model, none2()];
      }
    } else {
      return [model, none2()];
    }
  } else if (msg instanceof UserToggledEditing) {
    let $ = msg.editing;
    if ($) {
      let index4 = msg.index;
      let entries = try_update(
        model.entries,
        index4,
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
          return new Model(
            entries,
            _record.active,
            _record.completed,
            _record.uid,
            _record.visibility
          );
        })(),
        none2()
      ];
    } else {
      let index4 = msg.index;
      let entries = try_update(
        model.entries,
        index4,
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
          return new Model(
            entries,
            _record.active,
            _record.completed,
            _record.uid,
            _record.visibility
          );
        })(),
        none2()
      ];
    }
  } else {
    let index4 = msg.index;
    let description = msg.description;
    let entries = try_update(
      model.entries,
      index4,
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
        return new Model(
          entries,
          _record.active,
          _record.completed,
          _record.uid,
          _record.visibility
        );
      })(),
      none2()
    ];
  }
}
function main() {
  let app = application(init, update3, view);
  let $ = start3(app, ".todoapp", void 0);
  if (!($ instanceof Ok)) {
    throw makeError(
      "let_assert",
      "todomvc",
      16,
      "main",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  return void 0;
}

// build/.lustre/entry.mjs
main();
