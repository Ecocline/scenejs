/**
 *  Create display state chunk type for draw and pick render of geometry
 */
SceneJS_ChunkFactory.createChunkType({

    type:"geometry",

    build:function () {

        var draw = this.program.draw;

        this._aVertexDraw = draw.getAttribute("SCENEJS_aVertex");
        this._aNormalDraw = draw.getAttribute("SCENEJS_aNormal");
        this._aUVDraw = draw.getAttribute("SCENEJS_aUVCoord");
        this._aUV2Draw = draw.getAttribute("SCENEJS_aUVCoord2");
        this._aTangentDraw = draw.getAttribute("SCENEJS_aTangent");
        this._aColorDraw = draw.getAttribute("SCENEJS_aVertexColor");

        this._aMorphVertexDraw = draw.getAttribute("SCENEJS_aMorphVertex");
        this._aMorphNormalDraw = draw.getAttribute("SCENEJS_aMorphNormal");
        this._uMorphFactorDraw = draw.getUniformLocation("SCENEJS_uMorphFactor");

        var pick = this.program.pick;

        this._aVertexPick = pick.getAttribute("SCENEJS_aVertex");
        this._aMorphVertexPick = pick.getAttribute("SCENEJS_aMorphVertex");
        this._uMorphFactorPick = pick.getUniformLocation("SCENEJS_uMorphFactor");

        this.VAO = null;
        this.VAOMorphKey1 = 0;
        this.VAOMorphKey2 = 0;
        this.VAOHasInterleavedBuf = false;
    },

    recycle:function () {
        if (this.VAO) {
            // Guarantee that the old VAO is deleted immediately when recycling the object.
            var VAOExt = this.program.gl.getExtension("OES_vertex_array_object");
            VAOExt.deleteVertexArrayOES(this.VAO);
            this.VAO = null;
        }
    },

    morphDraw:function () {
        this.VAOMorphKey1 = this.core.key1;
        this.VAOMorphKey2 = this.core.key2;

        var target1 = this.core.targets[this.core.key1]; // Keys will update
        var target2 = this.core.targets[this.core.key2];

        if (this._aMorphVertexDraw) {
            this._aVertexDraw.bindFloatArrayBuffer(target1.vertexBuf);
            this._aMorphVertexDraw.bindFloatArrayBuffer(target2.vertexBuf);
        } else if (this._aVertexDraw) {
            this._aVertexDraw.bindFloatArrayBuffer(this.core2.vertexBuf);
        }

        if (this._aMorphNormalDraw) {
            this._aNormalDraw.bindFloatArrayBuffer(target1.normalBuf);
            this._aMorphNormalDraw.bindFloatArrayBuffer(target2.normalBuf);
        } else if (this._aNormalDraw) {
            this._aNormalDraw.bindFloatArrayBuffer(this.core2.normalBuf);
        }

        if (this._aUVDraw) {
            this._aUVDraw.bindFloatArrayBuffer(this.core2.uvBuf);
        }

        if (this._aUV2Draw) {
            this._aUV2Draw.bindFloatArrayBuffer(this.core2.uvBuf2);
        }

        if (this._aColorDraw) {
            this._aColorDraw.bindFloatArrayBuffer(this.core2.colorBuf);
        }

        this.setDrawMorphFactor();
    },

    setDrawMorphFactor:function () {

        if (this._uMorphFactorDraw) {
            this.program.gl.uniform1f(this._uMorphFactorDraw, this.core.factor); // Bind LERP factor
        }

    },

    draw:function (frameCtx) {
        var doMorph = this.core.targets && this.core.targets.length;
        var cleanInterleavedBuf = this.core2.interleavedBuf && !this.core2.interleavedBuf.dirty;

        if (this.VAO) {
            frameCtx.VAO.bindVertexArrayOES(this.VAO);
            if (doMorph) {
                if (this.VAOMorphKey1 == this.core.key1 && this.VAOMorphKey2 == this.core.key2) {
                    this.setDrawMorphFactor();
                    return;
                }
            } else if (cleanInterleavedBuf || !this.VAOHasInterleavedBuf) {
                return;
            }
        } else if (frameCtx.VAO) {
            // Start creating a new VAO by switching to the default VAO, which doesn't have attribs enabled.
            frameCtx.VAO.bindVertexArrayOES(null);
            this.VAO = frameCtx.VAO.createVertexArrayOES();
            frameCtx.VAO.bindVertexArrayOES(this.VAO);
            var gl = this.program.gl;
        }

        if (doMorph) {
            this.morphDraw();
        } else {
            if (cleanInterleavedBuf) {
                this.VAOHasInterleavedBuf = true;
                this.core2.interleavedBuf.bind();
                if (this._aVertexDraw) {
                    this._aVertexDraw.bindInterleavedFloatArrayBuffer(3, this.core2.interleavedStride, this.core2.interleavedPositionOffset);
                }
                if (this._aNormalDraw) {
                    this._aNormalDraw.bindInterleavedFloatArrayBuffer(3, this.core2.interleavedStride, this.core2.interleavedNormalOffset);
                }
                if (this._aUVDraw) {
                    this._aUVDraw.bindInterleavedFloatArrayBuffer(2, this.core2.interleavedStride, this.core2.interleavedUVOffset);
                }
                if (this._aUV2Draw) {
                    this._aUV2Draw.bindInterleavedFloatArrayBuffer(2, this.core2.interleavedStride, this.core2.interleavedUV2Offset);
                }
                if (this._aColorDraw) {
                    this._aColorDraw.bindInterleavedFloatArrayBuffer(4, this.core2.interleavedStride, this.core2.interleavedColorOffset);
                }
                if (this._aTangentDraw) {

                    // Lazy-compute tangents as soon as needed.
                    // Unfortunately we can't include them in interleaving because that happened earlier.
                    this._aTangentDraw.bindFloatArrayBuffer(this.core2.tangentBuf || this.core2.getTangentBuf());
                }
            } else {
                this.VAOHasInterleavedBuf = false;
                if (this._aVertexDraw) {
                    this._aVertexDraw.bindFloatArrayBuffer(this.core2.vertexBuf);
                }
                if (this._aNormalDraw) {
                    this._aNormalDraw.bindFloatArrayBuffer(this.core2.normalBuf);
                }
                if (this._aUVDraw) {
                    this._aUVDraw.bindFloatArrayBuffer(this.core2.uvBuf);
                }
                if (this._aUV2Draw) {
                    this._aUV2Draw.bindFloatArrayBuffer(this.core2.uvBuf2);
                }
                if (this._aColorDraw) {
                    this._aColorDraw.bindFloatArrayBuffer(this.core2.colorBuf);
                }
                if (this._aTangentDraw) {

                    // Lazy-compute tangents
                    this._aTangentDraw.bindFloatArrayBuffer(this.core2.tangentBuf || this.core2.getTangentBuf());
                }
            }
        }

        this.core2.indexBuf.bind();

    },

    morphPick:function () {

        var target1 = this.core.targets[this.core.key1]; // Keys will update
        var target2 = this.core.targets[this.core.key2];

        if (this._aMorphVertexPick) {
            this._aVertexPick.bindFloatArrayBuffer(target1.vertexBuf);
            this._aMorphVertexPick.bindFloatArrayBuffer(target2.vertexBuf);
        } else if (this._aVertexPick) {
            this._aVertexPick.bindFloatArrayBuffer(this.core2.vertexBuf);
        }

        if (this._uMorphFactorPick) {
            this.program.gl.uniform1f(this._uMorphFactorPick, this.core.factor); // Bind LERP factor
        }

    },

    pick:function (frameCtx) {

        if (this.core.targets && this.core.targets.length) {
            this.morphPick();

        } else {

            if (this._aVertexPick) {
                this._aVertexPick.bindFloatArrayBuffer(this.core2.vertexBuf);
            }
        }

        this.core2.indexBuf.bind();
    }
});
