;(function (global, $, document, undefined) {
	'use strict';

	var	fnName = 'slideranger',
		defaults = {
			useRange: true,
			defaultRange: {min: 1, max: 10},
			steps: 10,
			startAt: 0,
			stepInterval: 1,
			tabInterval: 2,
			labelInterval: 5,
			width: 300,
			handleWidth: 12,
			callback: function () {} // reserved
		},

		FN = function (el, params) {
			this.params = $.extend({}, defaults, params);
			this.$node = $(el).append($(this.templates.node).width(this.params.width));
			this.init();
		};

	FN.prototype = {
		templates: {
			evNode: '<div></div>',

			node: [
			'<div class="' + fnName + '-node">',
				'<div class="' + fnName + '-bar"></div>',
				'<div class="' + fnName + '-range"></div>',
				'<div class="' + fnName + '-tabs"></div>',
				'<div class="' + fnName + '-handles"></div>',
			'</div>'
			].join('\n'),

			tab: [
			'<div class="' + fnName + '-tab">',
				'<div class="' + fnName + '-notch"></div>',
				'<span class="' + fnName + '-label"></span>',
			'</div>'
			].join('\n'),

			handle: '<div class="' + fnName + '-handle"></div>'
		},

		init: function () {
			var steps = this.params.steps,
				defaultRange = this.params.defaultRange,
				tabWidth = this.tabWidth = 0 || (this.params.width - 2 * (this.padding || 0)) / steps,
				margin = this.margin = this.params.width - steps * tabWidth >> 1;

			this.$eventNode = $(this.templates.evNode);
			this.$range = this.$node.find('.' + fnName + '-range');
			this.$tabs = this.$node.find('.' + fnName + '-tabs');
			this.$handles = this.$node.find('.' + fnName + '-handles');
			this.tabArray = [];
			
			this.appendTabs(steps, tabWidth);
			this.appendHandles();
			this.setRange(defaultRange.min, defaultRange.max);
			this.listen();
		},

		listen: function () {
			$('body').on('mousemove', $.proxy(this, 'mouseMove'))
					 .on('mouseup', $.proxy(this, 'mouseUp'))
					 .on('mousewheel', $.proxy(this, 'mouseWheel'));
		},

		appendTabs: function (steps, tabWidth) {
			var $tab, $notch, $label,
				startAt = this.params.startAt,
				i, l;

			for (i = startAt, l = startAt + steps; i < l; i++) {
				$tab = $(this.templates.tab).css({ width: tabWidth });
				if (i % this.params.tabInterval === 0 || i === startAt || i === steps - 1) {
					$tab.addClass('notch-show');
				}
				if (i % this.params.labelInterval === 0 || i === startAt || i === steps - 1) {
					$tab.addClass('label-show');
				}
				$notch = $tab.find('.' + fnName + '-notch')
							.data('tab', i)
							.on('click', $.proxy(this, 'setEndpoint'));;
				$label = $tab.find('.' + fnName + '-label')
							.html(i)
							.data('tab', i)
							.on('click', $.proxy(this, 'setEndpoint'));
				this.$tabs.append($tab);
				this.tabArray.push($tab);
			}
		},

		appendHandles: function () {
			this.$handles.append(this.$lHandle = $(this.templates.handle).data('handle', 'left'));
			if (this.params.useRange) {
				this.$handles.append(this.$rHandle = $(this.templates.handle).data('handle', 'right'));
				this.$range.on('mousedown', $.proxy(this, 'rangeDown'));
			}
			this.$handles.on('mousedown', '.' + fnName + '-handle', $.proxy(this, 'handleDown'));
		},

		setEndpoint: function (e) {
			var tab = $(e.target).data('tab'),
				fromS = Math.abs(this.minPos - tab),
				fromE = Math.abs(this.maxPos - tab);
			this.oRange = [this.minPos, this.maxPos];

			if (fromE < fromS) {
				this.animateTo([this.minPos, tab]);
			}
			else {
				this.animateTo([tab, this.maxPos]);
			}
			e.preventDefault();
		},

		setRange: function (min, max) {
			var i, l;

			this.minPos = min;
			this.maxPos = max;

			this.$lHandle.css({
				left: min = this.getTargetPos(min)
			});
			this.$rHandle && this.$rHandle.css({
				left: max = this.getTargetPos(max)
			}) && this.$range.css({
				left: min + this.params.handleWidth / 2,
				width: max - min
			});
			if (max !== null) {
				for (i = 0, l = this.tabArray.length; i < l; i += 1) {
					this.tabArray[i][((this.minPos <= i) && (this.maxPos >= i)) ? 'addClass' : 'removeClass']('active')
				}
			}
			this.$node.trigger('range.update', [this.minPos, this.maxPos]);
			return this;
		},

		animateTo: function (range) {
			var oRange = [this.minPos, this.maxPos],
				self = this;
			this.$eventNode
				.css({ left: 0 })
				.animate({ left: 1 }, {
				step: function (val) {
					self.setRange(oRange[0] + (range[0] - oRange[0]) * val, oRange[1] + (range[1] - oRange[1]) * val);
				},
				complete: function () {
					if (self.params.useRange) {
						self.$node.trigger('range.complete', [self.minPos, self.maxPos]);
					}
					else {
						self.$node.trigger('range.complete', [self.minPos]);
					}
				}
			});
		},

		getTargetPos: function (ix) {
			return this.margin + this.tabWidth * ix + this.tabWidth / 2 - this.params.handleWidth / 2;
		},

		handleDown: function (e) {
			this.handleNm = $(e.target).data('handle');
			this.activeHandle = (this.handleNm === 'right') ? this.$rHandle : this.$lHandle;
			this.oRange = [this.minPos, this.maxPos];
			this.mouseX = e.pageX;
			e.preventDefault();
		},

		mouseMove: function (e) {
			if (this.handleNm === 'range') { this.rangeMove(e); }
			if (!this.activeHandle) { return; }

			var diff = e.pageX - this.mouseX,
				range = this.oRange.slice();

			range[this.handleNm === 'right' ? 1 : 0] += diff / this.tabWidth;

			if (this.handleNm === 'right') {
				range[1] = Math.min(this.params.startAt + this.params.steps - 1, Math.max(range[1], range[0] + 1));
			}
			else {
				range[0] = Math.max(this.params.startAt, Math.min(range[0], range[1] - 1));
			}
			this.setRange(range[0], range[1]);
			// e.preventDefault();
		},

		mouseWheel: function (e, delta) {
			if (this.params.mouseWheel) {
				var min = this.minPos,
					max = this.maxPos,
					start = this.params.startAt,
					end = this.params.steps - 1,
					diff = Math.abs(min - max);
				min = Math.max(start, min + delta);
				max = Math.min(end, max + delta);
				this.setRange(
					this.minPos = (max === end) ? max - diff : min,
					this.maxPos = (min === start) ? min + diff : max
				);
			}
		},

		mouseUp: function (e) {
			if (!this.handleNm) { return; }
			this.animateTo([Math.round(this.minPos), Math.round(this.maxPos)]);
			delete this.activeHandle;
			delete this.handleNm;
		},

		rangeDown: function (e) {
			e.preventDefault();
			this.handleNm = 'range';
			this.oRange = [this.minPos, this.maxPos];
			this.mouseX = e.pageX;
		},

		rangeMove: function (e) {
			var diff = e.pageX - this.mouseX,
				range = this.oRange.slice(),
				steps = this.params.steps;

			range[0] += diff / this.tabWidth;
			range[1] += diff / this.tabWidth;

			if (range[0] < 0) {
				range[1] += -range[0];
				range[0] = 0;
			}

			if (range[1] > (steps - 1)) {
				range[0] -= range[1] - steps + 1;
				range[1] = steps - 1;
			}

			this.setRange(range[0], range[1]);
			e.preventDefault();
		}
	};

	// jQuery plugin definition
	$.fn[fnName] = function (params) {
		return this.each(function () {
			var dataHandle = 'plugin_' + fnName;
			if (!$.data(this, dataHandle)) {
				$.data(this, dataHandle, new FN(this, params));
			}
		});
  	};

}(window, jQuery, document));