(function () {
    class Slider {
        constructor(options) {
            this.sliders = {};
            this.scaleWidth = 34;
            this.fillWidth = 35;
            this.knobWidth = 35;

            this.startAngle = 1.5 * Math.PI + 0.000001;
            this.endAngle = 1.5 * Math.PI - 0.000001;

            this.continuousMode = options.continuousMode || false;

            this.container = document.getElementById(options.canvasId);
            this.the_body = document.body;
            this.context = Slider.setupHiDpiCanvas(this.container);

            this.x0 = options.x0 === undefined ? this.container.width / 2 : options.x0;
            this.y0 = options.y0 === undefined ? this.container.height / 2 : options.y0;
            this.x0 /= window.devicePixelRatio || 1;
            this.y0 /= window.devicePixelRatio || 1;

            this.MouseX = 0;
            this.MouseY = 0;

            this.selectedSlider = null;
            this.currentSlider = null;

            this.rotationEventListener = this._rotation.bind(this);
            this.container.addEventListener('mousedown', this._handleMouseDown.bind(this), false);
            this.the_body.addEventListener('mouseup', this._handleMouseUp.bind(this), false);
            this.container.addEventListener('click', this._handleClick.bind(this), false);


            this.container.addEventListener('touchstart', this._handleTouch.bind(this), false);
            this.container.addEventListener('touchmove', this._handleMove.bind(this), false);
            this.container.addEventListener('touchend', this._handleEnd.bind(this), false);
        }

        static setupHiDpiCanvas(canvas) {
            let ctx = canvas.getContext('2d');
            let devicePixelRatio = window.devicePixelRatio || 1;
            let backingStoreRatio =
                ctx.webkitBackingStorePixelRatio ||
                ctx.mozBackingStorePixelRatio ||
                ctx.msBackingStorePixelRatio ||
                ctx.oBackingStorePixelRatio ||
                ctx.backingStorePixelRatio || 1;

            let ratio = devicePixelRatio / backingStoreRatio;
            // upscale the canvas if the two ratios don't match
            if (devicePixelRatio !== backingStoreRatio) {
                let oldWidth = canvas.width;
                let oldHeight = canvas.height;

                canvas.width = oldWidth * ratio;
                canvas.height = oldHeight * ratio;

                canvas.style.width = oldWidth + 'px';
                canvas.style.height = oldHeight + 'px';

                // now scale the context to counter
                // the fact that we've manually scaled
                // our canvas element
                ctx.scale(ratio, ratio);
            }
            return ctx;
        }

        // Adds a slider band to the slider
        addSlider(options) {
            this.sliders[options.id] = {
                id: options.id,
                container: document.getElementById(options.container),
                color: options.color || '#104b63',
                min: options.min || 0,
                max: options.max || 100,
                radius: options.radius || 100,
                startAngle: this.startAngle,
                endAngle: this.endAngle,
                onValueChangeCallback: options.changed || function (v) {},
                ang_degrees: 0,
                normalizedValue: options.min || 0,
                step: options.step || 1
            };

            const obj = this.sliders[options.id];
            if (!options.bNoCallBack) this.setSliderValue(obj.id, options.min);   //Added bNoCallBack so timer is not fired on slider instantiation 
        }

        // Sets (draws) slider band value given the band id and value
        setSliderValue(id, value, bNoCallBack) {    //Added bNoCallBack to add option to turn off onValueChangeCallback
            const slider = this.sliders[id];
            if (value <= slider.min) {
                slider.endAngle = this.startAngle;
                slider.ang_degrees = 0;
                slider.normalizedValue = 0;
            } else if (value >= slider.max) {
                slider.endAngle = this.endAngle;
                slider.ang_degrees = 360;
                slider.normalizedValue = slider.max;
            } else {
                //value = (value / slider.step >> 0) * slider.step;
                slider.endAngle = 2 * Math.PI * (value - slider.min) / (slider.max - slider.min) - Math.PI / 2;
                slider.ang_degrees = Slider.radToDeg(Slider.normalizeTan(slider.endAngle));
                slider.normalizedValue = value;
            }

            this.drawAll(bNoCallBack);
        }

        // Redraws everything
        drawAll(bNoCallBack) {
            this.context.clearRect(0, 0, this.container.width, this.container.height);
            for (let key in this.sliders) {
                if (!this.sliders.hasOwnProperty(key)) continue;
                const obj = this.sliders[key];
                this.drawScale(obj);
                this.drawData(obj);
                this.drawArrow(obj);
                this.drawKnob(obj);
                if (!bNoCallBack) obj.onValueChangeCallback({'rad': obj.endAngle, 'deg': obj.ang_degrees, 'value': obj.normalizedValue});
            }
            this.drawCenterDot();
        }

        // Draw the scale for a selected slider band
        drawScale(slider) {
            // Scale
            for (let i = 0; i <= 2 * Math.PI; i += Math.PI / 6) {
                this.context.beginPath();
                this.context.strokeStyle = '#eeeeee';
                this.context.arc(this.x0, this.y0, slider.radius, i, i + Math.PI / 4, false);
                this.context.lineWidth = this.scaleWidth;
                this.context.stroke();
            }
        }

        // Draw dot in the center
        drawCenterDot () {
            this.context.beginPath();
            this.context.strokeStyle = '#eeeeee';
            this.context.arc(this.x0, this.y0, this.scaleWidth/2, 0, Math.PI*2, false);
            this.context.lineWidth = 1;
            this.context.fillStyle = '#eeeeee';
            this.context.fill();
        }

        // Draw the data on the selected slider band
        drawData(slider) {
            this.context.beginPath();
            this.context.strokeStyle = slider.color;
            this.context.arc(this.x0, this.y0, slider.radius, slider.startAngle, slider.endAngle, false);
            this.context.lineWidth = this.fillWidth;
            this.context.stroke();
        }

        // Draw tail arrow
        drawArrow(slider) {
            this.context.beginPath();
            this.context.moveTo(this.x0, this.y0 - slider.radius + this.scaleWidth / 2);
            this.context.lineTo(this.x0, this.y0 - this.scaleWidth - slider.radius + this.scaleWidth / 2);
            this.context.lineTo(this.x0 + this.scaleWidth / 4, this.y0 - this.scaleWidth / 2 - slider.radius + this.scaleWidth / 2);
            this.context.fillStyle = "#eeeeee";
            this.context.fill();
        }

        // Draw the knob (control element)
        drawKnob(slider) {
            // Knob
            this.context.beginPath();
            this.context.strokeStyle = '#eb879c';
            this.context.arc(
                Math.cos(slider.endAngle) * slider.radius + this.x0,
                Math.sin(slider.endAngle) * slider.radius + this.y0,
                this.knobWidth / 2,
                0, Math.PI * 2, false
            );
            this.context.lineWidth = 1;

            this.context.fillStyle = '#eb879c';
            this.context.fill();

            // Dot on the knob
            this.context.beginPath();
            this.context.strokeStyle = 'yellow';
            this.context.arc(
                Math.cos(slider.endAngle) * slider.radius + this.x0,
                Math.sin(slider.endAngle) * slider.radius + this.y0,
                this.scaleWidth / 10,
                0, Math.PI * 2, false
            );
            this.context.lineWidth = 1;
            this.context.fillStyle = 'yellow';
            this.context.fill();
        }

        // Calculate angles given the cursor position
        calculateAngles(x, y) {
            if (!this.selectedSlider) return;

            let max = this.selectedSlider.max,
                min = this.selectedSlider.min,
                step = this.selectedSlider.step,
                endAngle = Math.atan2(y - this.y0, x - this.x0),
                ang_degrees = Slider.radToDeg(Slider.normalizeTan(endAngle)),
                normalizedValue = Slider.normalizeTan(endAngle) * (max - min) / (2 * Math.PI) + min;

            normalizedValue = (normalizedValue / step >> 0) * step;

            this.selectedSlider.endAngle = endAngle;
            this.selectedSlider.ang_degrees = ang_degrees;
            this.selectedSlider.normalizedValue = normalizedValue;
        }

        // Helper method
        static radToDeg(ang) {
            return ang * 180 / Math.PI;
        }

        // Normalizes tangent
        static normalizeTan(ang) {
            return ang + Math.PI / 2 > 0 ? ang + Math.PI / 2 : (2 * Math.PI + ang + Math.PI / 2);
        }

        // Calculates cursor coordinates
        calculateUserCursor() {
            const rect = this.container.getBoundingClientRect();

            if (event.touches) {
                this.MouseX = event.touches[0].clientX - rect.left;
                this.MouseY = event.touches[0].clientY - rect.top;
            } else {
                this.MouseX = event.clientX - rect.left;
                this.MouseY = event.clientY - rect.top;
            }
        }


        // Returns a slider band based on the cursor position
        getSelectedSlider() {
            this.calculateUserCursor();
            const hip = Math.sqrt(Math.pow(this.MouseX - this.x0, 2) + Math.pow(this.MouseY - this.y0, 2));
            let selectedSlider;

            for (let key in this.sliders) {
                if (!this.sliders.hasOwnProperty(key)) continue;
                const obj = this.sliders[key];
                if (Math.abs(hip - obj.radius) <= this.scaleWidth / 2) {
                    selectedSlider = obj;
                    break;
                }
            }
            return selectedSlider ? selectedSlider : null;
        }


        // Event handlers (mousedown, mouseup, mousemove, mouseclick, touches)
        _handleMouseDown(event) {
            event.preventDefault();
            this.selectedSlider = this.getSelectedSlider();
            if (!this.selectedSlider) return;
            this.the_body.addEventListener('mousemove', this.rotationEventListener, false);
        }

        _handleMouseUp(event) {
            event.preventDefault();
            this.the_body.removeEventListener('mousemove', this.rotationEventListener, false);
            this.currentSlider = this.selectedSlider;
        }

        _handleClick(event) {
            this.selectedSlider = this.getSelectedSlider();
            if (this.currentSlider && this.getSelectedSlider() && this.currentSlider.id !== this.getSelectedSlider().id) return;
            if (this.selectedSlider) this._rotation();
        }

        _handleTouch(event) {
            event.preventDefault();
            this.selectedSlider = this.getSelectedSlider();
            if (this.selectedSlider) this._rotation();
        }

        _handleMove(event) {
            event.preventDefault();
            if (this.continuousMode) this._rotation();
            else if (this.selectedSlider) this._rotation();
        }

        _handleEnd(event) {
            event.preventDefault();
            this.the_body.removeEventListener('mousemove', this.rotationEventListener, false);
        }

        // Rotation wrapper
        _rotation() {
            this.calculateUserCursor();
            if (this.continuousMode) this.selectedSlider = this.getSelectedSlider();
            this.calculateAngles(this.MouseX, this.MouseY);
            this.drawAll();
        }
    }


    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
        module.exports = Slider;
    else window.Slider = Slider;
})();
