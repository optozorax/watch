(() => {

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

// This function will fetch and return timer state string
function getTimerState1() {
  const state = hmFS.SysProGetChars("mmk_tb_timer_state");
  if(!state) return ""; // timer isn't started

  const [id, startedTime, endTime] = state.split(":").map((v) => parseInt(v));
  let delay = Math.floor((endTime - Date.now()) / 1000);
  delay += 1; // костыль, почему-то вибрация срабатывает на секунду позже
  if (delay <= 0) return ""; // timer was out, but not cleaned for some reason

  const minute = Math.floor((delay / 60)).toString().padStart(2, "0");
  const second = (delay % 60).toString().padStart(2, "0");
  return `${minute}:${second}`;
}

function getTimerState2() {
  const state = hmFS.SysProGetChars("mmk_tb_timer_state");
  if(!state) return 0; // timer isn't started

  const [id, startedTime, endTime] = state.split(":").map((v) => parseInt(v));
  const delay = Math.floor((endTime - Date.now()) / 1000);
  if(delay <= 0) return 0; // timer was out, but not cleaned for some reason

  const state2 = hmFS.SysProGetInt("mmk_tb_timer_last");
  if (!state2) return 0;

  if (delay > state2) {
    return 1.0;
  }
  return (delay + 0.0) / state2;
}

function DarkColor(a, amt) {
  let t = a < 256 ? `0000${a.toString(16)}` : a < 65536 ? `00${a.toString(16)}` : a.toString(16)
  let r = Math.floor(parseInt(t.substring(0, 2), 16) * amt / 100)
  let g = Math.floor(parseInt(t.substring(2, 4), 16) * amt / 100)
  let b = Math.floor(parseInt(t.substring(4, 6), 16) * amt / 100)

  let rx = r < 16 ? `0f` : r.toString(16)
  let gx = g < 16 ? `0f` : g.toString(16)
  let bx = b < 16 ? `0f` : b.toString(16)
  return (`0x${rx}${gx}${bx}`)
}

function BrightColor(a, amt) {
  let t = a < 256 ? `0000${a.toString(16)}` : a < 65536 ? `00${a.toString(16)}` : a.toString(16)
  let r = Math.max(Math.min(parseInt(t.substring(0, 2), 16) + amt, 255), 0).toString(16)
  let g = Math.max(Math.min(parseInt(t.substring(2, 4), 16) + amt, 255), 0).toString(16)
  let b = Math.max(Math.min(parseInt(t.substring(4, 6), 16) + amt, 255), 0).toString(16)

  const rx = (r.length < 2 ? '0' : '') + r
  const gx = (g.length < 2 ? '0' : '') + g
  const bx = (b.length < 2 ? '0' : '') + b
  return (`0x${rx}${gx}${bx}`)
}

class TimerScreenCustom {
	minute = 1;
	second = 0;

	editButtons = [];
	localTimer = null;
	timerID = null;
	startedTime = 0;
	endTime = 0;
	timer_angle_offset = 8;

	formatDisplay(v) {
		return v.toString().padStart(2, "0");
	}

	start(input) {
		this.input = input;

		// Load all
		let lastDX = hmFS.SysProGetInt("mmk_tb_timer_last");
		if (this.input.startTime) lastDX = this.input.startTime;
		if(lastDX) {
			this.minute = Math.floor(lastDX / 60);
			this.second = lastDX % 60;
		}

		const state = hmFS.SysProGetChars("mmk_tb_timer_state");
		if (state) {
			const [id, startedTime, endTime] = state.split(":");
			if(Date.now() < endTime) {
				this.timerID = parseInt(id);
				this.startedTime = parseInt(startedTime);
				this.endTime = parseInt(endTime);
			}
		}

		this.initView();
		this.updateLayout();

		if (this.input.startTime) this.runTimer();
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

	initView() {
		const blueColor = 0x0095ff;

		this.vibrate = hmSensor.createSensor(hmSensor.id.VIBRATE);

		this.timer_group = hmUI.createWidget(hmUI.widget.GROUP, {
      x: 6,
      y: 490/2-180/2,
      w: 180,
      h: 180,
    });

		this.timer_group.createWidget(hmUI.widget.ARC, {
      x: 0,
      y: 0,
      w: 180,
      h: 180,
      start_angle: -90 + this.timer_angle_offset,
      end_angle: 360-90 - this.timer_angle_offset,
      color: DarkColor(blueColor, 25),
      line_width: 15,
      show_level: hmUI.show_level.ONLY_NORMAL,
    });

    this.timer_arc = this.timer_group.createWidget(hmUI.widget.ARC, {
      x: 0,
      y: 0,
      w: 180,
      h: 180,
      start_angle: -90 - this.timer_angle_offset,
      end_angle: -90 + this.timer_angle_offset,
      color: blueColor,
      line_width: 15,
      show_level: hmUI.show_level.ONLY_NORMAL,
    });

    this.timer_group.createWidget(hmUI.widget.IMG, {
      x: 180/2-31/2,
      y: -31/2+5,
      src: 'timer.png'
    });

    this.timer_group.createWidget(hmUI.widget.IMG, {
      x: 180/2-70/2,
      y: (90+20)/2-5,
      src: 'home.png'
    })
    .addEventListener(hmUI.event.CLICK_UP, function (info) {
      hmApp.gotoHome()
    });

    this.timer_group.setProperty(hmUI.prop.VISIBLE, false);

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

		this.actionButton = hmUI.createWidget(hmUI.widget.BUTTON, {
			x: 0,
			y: 400,
			w: 192,
			h: 90,
			text: "Start",
			normal_color: 0x222222,
			press_color: 0x333333,
			color: 0xFFFFFF,
			text_size: 30,
			click_func: () => {
				this.short_vibro();
				this.timerID !== null ? this.stopTimer() : this.runTimer();
			}
		})
	}

	runTimer() {
		let currentState = getTimerState1();
		if (currentState != "") {
			const state = hmFS.SysProGetChars("mmk_tb_timer_state");
		  const [id, startedTime, endTime] = state.split(":").map((v) => parseInt(v));
		  hmFS.SysProSetChars("mmk_tb_timer_state", "");
			try {
				hmApp.alarmCancel(id);
			} catch(e) {
				console.log(e);
				hmUI.showToast({text: "Can't cancel OS app alarm"});
			}
			hmUI.showToast({text: "Cancelled previous timer at " + currentState});
		}

		const dx = this.minute * 60 + this.second;
		if(dx === 0) return;

		this.startedTime = Date.now();
		this.endTime = this.startedTime + dx * 1000;
		this.timerID = 1;

		try {
			this.timerID = hmApp.alarmNew({
				url: "page/timer_out",
				appid: 95053,
				delay: dx
			})
		} catch(e) {
			console.log(e);
			hmUI.showToast({text: "Can't start OS app alarm"});
		}

		// Bundle data for persistant
		const bundle = this.timerID + ":" + this.startedTime + ":" + this.endTime;
		hmFS.SysProSetChars("mmk_tb_timer_state", bundle);
		if (!this.input.startTime) hmFS.SysProSetInt("mmk_tb_timer_last", dx);

		this.updateLayout();
	}

	stopTimer() {
		hmFS.SysProSetChars("mmk_tb_timer_state", "");
		try {
			hmApp.alarmCancel(this.timerID);
		} catch(e) {
			console.log(e);
			hmUI.showToast({text: "Can't cancel OS app alarm"});
		}

		let delay = Math.floor((this.endTime - Date.now()) / 1000);

		this.timerID = null;
		this.updateLayout();
		this.refresh();

		if (this.input.startTime) hmApp.goBack();
	}

	refresh() {
		let minute = this.minute,
			second = this.second;

		if (this.timerID) {
			let delay = Math.floor((this.endTime - Date.now()) / 1000);
			if(delay < 0) delay = 0;

			minute = Math.floor(delay / 60);
			second = delay % 60;
		}

		this.timer_arc.setProperty(hmUI.prop.MORE, { end_angle: -90 + this.timer_angle_offset - getTimerState2() * 360. })

		this.view_time.setProperty(hmUI.prop.TEXT, this.get_time_custom(minute, second));
	}

	updateLayout() {
		// Hide edit buttons if timer started
		this.editButtons.forEach((v) => {
			v.setProperty(hmUI.prop.VISIBLE, this.timerID === null);
		});

		this.timer_group.setProperty(hmUI.prop.VISIBLE, this.timerID !== null);

		// Set button text
		const buttonText = this.timerID === null ? "Start" : "Cancel";
		this.actionButton.setProperty(hmUI.prop.TEXT, buttonText);

		// UI update timer
		if(this.timerID && !this.localTimer) {
			this.localTimer = timer.createTimer(0, 500, () => this.refresh());
		} else if(this.timerID === null && this.localTimer) {
			timer.stopTimer(this.localTimer);
			this.localTimer = null;
		}

		this.refresh();
	}
}

let __$$app$$__ = __$$hmAppManager$$__.currentApp;
let __$$module$$__ = __$$app$$__.current;
__$$module$$__.module = DeviceRuntimeCore.Page({
  onInit(p) {
  	if (((typeof p) === 'string') && p != 'undefined') {
  		new TimerScreenCustom().start(JSON.parse(p))	
  	} else {
  		new TimerScreenCustom().start({})
  	}
  }
});

})();
