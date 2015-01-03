/**
 *   This file is part of wald-query.
 *   Copyright (C) 2014  Kuno Woudt <kuno@frob.nl>
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of copyleft-next 0.3.0.  See LICENSE.txt.
 */

var wald = wald ? wald : {};
wald.query = wald.query ? wald.query : {};
wald.query.util = {};

(function () {
    "use strict";

    if (typeof require === 'function') {
        var Lazy = require ('lazy.js');
    }

    wald.query.util.unwrap_lazy = function (sequence) {
        if (sequence instanceof Lazy.ArrayLikeSequence) {
            return sequence.toArray ();
        } else if (sequence instanceof Lazy.ObjectLikeSequence) {
            return sequence.toObject ();
        } else if (sequence instanceof Lazy.StringLikeSequence) {
            return sequence.toString ();
        } else if (sequence instanceof Lazy.Sequence) {
            return sequence.toArray ();
        } else {
            return sequence;
        }
    }

})();

if (typeof module === 'object') {
    module.exports = wald.query.util;
}
