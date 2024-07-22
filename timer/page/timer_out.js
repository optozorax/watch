(() => {

function getTimerState1() {
  const state = hmFS.SysProGetChars("mmk_tb_timer_state_copy");
  if(!state) return ""; // timer isn't started

  const [id, startedTime, endTime] = state.split(":").map((v) => parseInt(v));
  let delay = Math.floor((endTime - Date.now()) / 1000);
  delay += 1; // костыль, почему-то вибрация срабатывает на секунду позже
  delay = -delay; // специально для экрана отображения вибрации
  if (delay < 0) return "";
  return `${delay}`;
}

  let vibrate;

  let __$$app$$__ = __$$hmAppManager$$__.currentApp;
  let __$$module$$__ = __$$app$$__.current;
  __$$module$$__.module = DeviceRuntimeCore.Page({
    build() {
      hmSetting.setBrightScreen(180);

      // Bell icon
      let counter = 0;
      let icon = hmUI.createWidget(hmUI.widget.IMG, {
        x: (192-64)/2,
        y: 120,
        src: "timer/bell.png"
      });

      // Auto-exit after 0.5m
      timer.createTimer(30000, 30000, () => {
        hmApp.goBack();
      });

      // Exit button
      hmUI.createWidget(hmUI.widget.IMG, {
        x: (192-72)/2,
        y: 300,
        src: "timer/bell_stop.png"
      }).addEventListener(hmUI.event.CLICK_UP, () => {
        hmApp.goBack();
      });

      hmUI.createWidget(hmUI.widget.IMG, {
        x: 0,
        y: 300,
        w: 190,
        h: 490-300,
        src: 'zero.png',
        show_level: hmUI.show_level.ONLY_NORMAL
      })
      .addEventListener(hmUI.event.CLICK_UP, function (info) {
        hmApp.goBack();
      })

      // Vibro
      vibrate = hmSensor.createSensor(hmSensor.id.VIBRATE);
      vibrate.scene = 28;
      vibrate.start();

      timer.createTimer(0, 5000, () => {
        vibrate.stop();
        vibrate.scene = 28;
        vibrate.start();
      });

      console.log(hmFS.SysProGetChars("mmk_tb_timer_state"));

      hmFS.SysProSetChars("mmk_tb_timer_state_copy", hmFS.SysProGetChars("mmk_tb_timer_state"));

      // text
      let view_time = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0, y: 220, w: 192, h: 50,
        text: "-" + getTimerState1() + " sec",
        x: 0,
        text_size: 40,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        color: 0xffffff
      });

      timer.createTimer(0, 500, () => {
        view_time.setProperty(hmUI.prop.TEXT, "-" + getTimerState1() + " sec");
      });

      // Wipe
      hmFS.SysProSetChars("mmk_tb_timer_state", "");
    },
    onDestroy: () => {
      vibrate.stop();
      hmSetting.setBrightScreenCancel();
    }
  })
})();