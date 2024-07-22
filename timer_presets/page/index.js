(() => {

function CalcText(value) {
	let text = "";
	if (value % 60 == 0) {
		return value / 60 + "m";
	} else if (value < 60) {
		return value + "s";
	} else {
		if (value % 60 < 10) {
			return (value - (value % 60)) / 60 + ":0" + (value % 60);
		} else {
			return (value - (value % 60)) / 60 + ":" + (value % 60);
		}
	}
}

class TouchEventManager {
	ontouch = null;
	onlongtouch = null;
	onlongtouchrepeatly = null;
	ontouchdown = null;
	ontouchup = null;
	ontouchmove = null;

	constructor(widget) {
		this._init(widget);
	}

	_init(widget) {
		let handleClick = true;
		let timerLongTap = -1;

		widget.addEventListener(hmUI.event.CLICK_UP, (e) => {
			if(this.ontouchup) this.ontouchup(e);
			if(handleClick && this.ontouch) this.ontouch(e);

			handleClick = false;
			timer.stopTimer(timerLongTap);
		});

		widget.addEventListener(hmUI.event.CLICK_DOWN, (e) => {
			if(this.ontouchdown) this.ontouchdown(e);

			handleClick = true;
			timerLongTap = timer.createTimer(750, 250, () => {
				if(handleClick && this.onlongtouch) {
					this.onlongtouch(e);
					handleClick = false;
				}

				if(this.onlongtouchrepeatly) 
					this.onlongtouchrepeatly(e);
			})
		});

		widget.addEventListener(hmUI.event.MOVE, (e) => {
			if(this.ontouchmove) this.ontouchmove(e);
			
			handleClick = false;
			timer.stopTimer(timerLongTap);
		})
	}
}

class TimerScreen {
	minute = 1;
	second = 0;

	editButtons = [];
	localTimer = null;
	startedTime = 0;
	endTime = 0;

	maxTimersCount = 8;
	timersStartY = 75 + 40 - 85;
	timers = [5, 60, 71];
	timersButtons = [];
	timersFills = [];
	deleteMode = false;

	formatDisplay(v) {
		return v.toString().padStart(2, "0");
	}

	start() {
		const timers = hmFS.SysProGetChars("mmk_tb_timers");
		if (timers == "-") {
			this.timers = [];
		} else if (timers) {
			this.timers = timers.split(",").map((v) => parseInt(v));
		}

		this.initView();
		this.updateLayout();
	}

	get_time() {
		return this.get_time_custom(this.minute, this.second);
	}

	get_time_custom(minute, second) {
		return this.formatDisplay(minute) + ':' + this.formatDisplay(second);
	}

	short_vibro() {
		this.vibrate.stop();
		this.vibrate.scene = 23;
  	this.vibrate.start();
	}

	deleteTimer(pos) {
		this.timers.splice(pos, 1);
		this.updateLayout();
	}

	initView() {
		const blueColor = 0x0095ff;
		const redColor = 0xff0011;

		this.vibrate = hmSensor.createSensor(hmSensor.id.VIBRATE);

		this.edit_time_group = hmUI.createWidget(hmUI.widget.GROUP, { x: 0, y: 0, w: 192, h: 490 });
		this.view_time = this.edit_time_group.createWidget(hmUI.widget.TEXT, {
			x: 0, y: 40, w: 192, h: 50,
			text: this.get_time(),
			x: 0,
			text_size: 50,
			align_h: hmUI.align.CENTER_H,
			align_v: hmUI.align.CENTER_V,
			color: 0xffffff
		});

		const r = 40;
		const start_y = 75;
		const padding_x = 10;
		const offset_y = r*2+5;
		const text_y = -4;
		const color_back = 0x222222;
		const color_text = blueColor;
		const style_back = { h: r*2, w: r*2, radius: r, color: color_back, };
		const style_text = {
			h: r*2,
			w: r*2,
			color: color_text,
			align_h: hmUI.align.CENTER_H,
			align_v: hmUI.align.CENTER_V,
			text_size: 30,
		};

		function add_button(obj, x, y, text, key, value) {
			let fill_widget = obj.edit_time_group.createWidget(hmUI.widget.FILL_RECT, {
				x: x, y: y, ...style_back
			});
      obj.editButtons.push(fill_widget);
			let text_widget = obj.edit_time_group.createWidget(hmUI.widget.TEXT, {
				x: x, y: y + text_y, text: text, ...style_text,
			});
			const events = new TouchEventManager(text_widget);
			events.ontouch = () => {
        let val = obj[key] + value;
				if (val < 0) val += 60;
				if (val >= 60) val -= 60;

				obj[key] = val;

				obj.short_vibro();

				obj.refresh();
      };
			obj.editButtons.push(text_widget);
		}

		add_button(this, padding_x, start_y+r, "-s", "second", -1);
		add_button(this, 190-padding_x-r*2, start_y+r, "+s", "second", 1);
		add_button(this, padding_x, start_y+r+offset_y, "-10s", "second", -10);
		add_button(this, 190-padding_x-r*2, start_y+r+offset_y, "+10s", "second", 10);
		add_button(this, padding_x, start_y+r+offset_y*2, "-m", "minute", -1);
		add_button(this, 190-padding_x-r*2, start_y+r+offset_y*2, "+m", "minute", 1);

		this.actionButton = this.edit_time_group.createWidget(hmUI.widget.BUTTON, {
			x: 0,
			y: 400,
			w: 192,
			h: 90,
			text: "Add",
			normal_color: 0x222222,
			press_color: 0x333333,
			color: 0xFFFFFF,
			text_size: 30,
			click_func: () => {
				this.short_vibro();
				this.addMode = false;
				this.timers.push(this.minute * 60 + this.second);
				this.timers.sort(function(a, b) {
				  return a - b;
				});
				this.updateLayout();
			}
		})

		this.edit_time_group.setProperty(hmUI.prop.VISIBLE, false);

		this.timers_group = hmUI.createWidget(hmUI.widget.GROUP, { x: 0, y: 0, w: 192, h: 490 });

		function add_timer(obj, pos, start_y) {
			let x = 0;
			if (pos % 2 == 0) {
				x = padding_x;
			} else {
				x = 190-padding_x-r*2;
			}
			let y = start_y + offset_y * (pos - (pos % 2)) / 2;

			let fill_widget = obj.timers_group.createWidget(hmUI.widget.FILL_RECT, {
				x: x, y: y, ...style_back
			});
			fill_widget.setProperty(hmUI.prop.VISIBLE, false);
      obj.timersFills.push(fill_widget);
			let text_widget = obj.timers_group.createWidget(hmUI.widget.TEXT, {
				x: x, y: y + text_y, text: "?", ...style_text,
			});
			text_widget.setProperty(hmUI.prop.VISIBLE, false);
			const events = new TouchEventManager(text_widget);
			events.ontouch = () => {
				obj.short_vibro();
				if (obj.deleteMode) {
					obj.deleteTimer(pos);
				} else {
					hmApp.startApp( {appid: 95053, url: "page/index", param: '{"startTime":' + obj.timers[pos] + '}'} )
				}
      };
			obj.timersButtons.push(text_widget);
		}

		for (var i = 0; i < this.maxTimersCount; i++) {
			add_timer(this, i, this.timersStartY);
		}		

		const deleteText = "   DEL";
		this.deleteButton = this.timers_group.createWidget(hmUI.widget.BUTTON, {
			x: 0,
			y: 400,
			w: 192 / 2,
			h: 90,
			text: deleteText,
			normal_color: 0x442222,
			press_color: 0x553333,
			color: 0xFFFFFF,
			text_size: 30,
			click_func: () => {
				this.short_vibro();
				this.deleteMode = !this.deleteMode;
				if (this.deleteMode) {
					this.deleteButton.setProperty(hmUI.prop.TEXT, "  DONE");
					this.timersButtons.forEach((x) => { x.setProperty(hmUI.prop.MORE, { color: redColor }) });
				} else {
					this.deleteButton.setProperty(hmUI.prop.TEXT, deleteText);
					this.timersButtons.forEach((x) => { x.setProperty(hmUI.prop.MORE, { color: blueColor }) });
				}
			}
		})

		this.addButton = this.timers_group.createWidget(hmUI.widget.BUTTON, {
			x: 192 / 2,
			y: 400,
			w: 192 / 2,
			h: 90,
			text: "+  ",
			normal_color: 0x222244,
			press_color: 0x333355,
			color: 0xFFFFFF,
			text_size: 30,
			click_func: () => {
				this.short_vibro();
				this.addMode = true;
				this.minute = 1;
				this.second = 0;
				this.updateLayout();
			}
		})
	}

	refresh() {
		this.view_time.setProperty(hmUI.prop.TEXT, this.get_time_custom(this.minute, this.second));
	}

	updateLayout() {
		if (this.timers.length == 0) {
			hmFS.SysProSetChars("mmk_tb_timers", '-');
		} else {
			hmFS.SysProSetChars("mmk_tb_timers", this.timers.join(','));
		}

		if (this.addMode) {
			this.edit_time_group.setProperty(hmUI.prop.VISIBLE, true);
			this.timers_group.setProperty(hmUI.prop.VISIBLE, false);
		} else {
			this.edit_time_group.setProperty(hmUI.prop.VISIBLE, false);
			this.timers_group.setProperty(hmUI.prop.VISIBLE, true);
		}

		if (this.timers.length == this.maxTimersCount) {
			this.addButton.setProperty(hmUI.prop.MORE, {
				normal_color: 0x222222,
				press_color: 0x222222,
			});
		} else {
			this.addButton.setProperty(hmUI.prop.MORE, {
				normal_color: 0x222244,
				press_color: 0x333355,
			});
		}

		for (var i = 0; i < this.maxTimersCount; i++) {
			this.timersFills[i].setProperty(hmUI.prop.VISIBLE, false);
			this.timersButtons[i].setProperty(hmUI.prop.VISIBLE, false);
		}

		for (var i = 0; i < this.timers.length; i++) {
			this.timersFills[i].setProperty(hmUI.prop.VISIBLE, true);
			this.timersButtons[i].setProperty(hmUI.prop.VISIBLE, true);
			this.timersButtons[i].setProperty(hmUI.prop.TEXT, CalcText(this.timers[i]));
		}

		this.refresh();
	}
}


let __$$app$$__ = __$$hmAppManager$$__.currentApp;
let __$$module$$__ = __$$app$$__.current;
__$$module$$__.module = DeviceRuntimeCore.Page({
  onInit(p) {
    new TimerScreen().start()
  }
});

})();
