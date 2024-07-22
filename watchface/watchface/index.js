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
  return `${minute}.${second}`;
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

try {
  (() => {
    const init_view = () => {
      // hmFS.SysProSetChars("mmk_tb_timer_state", 5 + ":" + Date.now() + ":" + (Date.now() + (0*99*60 + 10)*1000));
      // hmFS.SysProSetInt("mmk_tb_timer_last", 10);

      let screenType = hmSetting.getScreenType()
      let wfScreen = hmSetting.screen_type.WATCHFACE
      let aodScreen = hmSetting.screen_type.AOD
      let EditScreen = hmSetting.screen_type.SETTINGS

      let langIndex = hmSetting.getLanguage()
      let lang = langIndex == 4 ? 0 : 1
      let lang2 = langIndex == 4 ? 'ru' : 'en'

      const LangArray = [['Цвет', 'Вид часов: ', 'классический', 'современный'],
                         ['Color', 'Type of watch: ', 'classic', 'modern']]

      const ColorsArray = [0x0095ff, 0xff6a00, 0xff0077, 0xffd000, 0x4cff00, 0x660099]

      const blueColor = 0x0095ff;
      const pinkColor = 0xff0077;
      const redColor = 0xff0011;
      const orangeColor = 0xff6a00;
      const yellowColor = 0xffd000;
      const greenColor = 0x4cff00;
      const violetColor = 0x660099;

      const Text3Array = Array.from(Array(10), (v, k) => `images/text3/${k}.png`)

      const editColorPalette = hmUI.createWidget(hmUI.widget.WATCHFACE_EDIT_GROUP, {
        edit_id: 101,
        x: 0,
        y: 0,
        w: 192,
        h: 80,
        select_image: 'images/zero.png',
        un_select_image: 'images/zero.png',
        default_type: 0,
        optional_types: [
          { type: 0, preview: 'images/edit/0.png', title_en: LangArray[lang][0] },
          { type: 1, preview: 'images/edit/1.png', title_en: LangArray[lang][0] },
          { type: 2, preview: 'images/edit/2.png', title_en: LangArray[lang][0] },
          { type: 3, preview: 'images/edit/3.png', title_en: LangArray[lang][0] },
          { type: 4, preview: 'images/edit/4.png', title_en: LangArray[lang][0] },
          { type: 5, preview: 'images/edit/5.png', title_en: LangArray[lang][0] }
        ],
        count: 6,
        tips_x: 50,
        tips_y: 90,
        tips_width: 92,
        tips_margin: 5,
        tips_BG: 'images/tips_bg.png'
      })

      let colorType = screenType == EditScreen ? 0 : editColorPalette.getProperty(hmUI.prop.CURRENT_TYPE)
      let bgColor = ColorsArray[colorType]

      const editStepScaleColor = hmUI.createWidget(hmUI.widget.WATCHFACE_EDIT_GROUP, {
        edit_id: 102,
        x: 0,
        y: 82,
        w: 192,
        h: 326,
        select_image: 'images/zero.png',
        un_select_image: 'images/zero.png',
        default_type: 0,
        optional_types: [
          { type: 0, preview: 'images/edit/classic.png', title_en: LangArray[lang][1] + LangArray[lang][2] },
          { type: 1, preview: 'images/edit/modern.png', title_en: LangArray[lang][1] + LangArray[lang][3] }
        ],
        count: 2,
        default_type: 0,
        tips_x: 50,
        tips_y: 230,
        tips_width: 92,
        tips_margin: 5,
        tips_BG: 'images/tips_bg.png'
      })

      let watchType = screenType == EditScreen ? 0 : editStepScaleColor.getProperty(hmUI.prop.CURRENT_TYPE)

      if (screenType == wfScreen | screenType == aodScreen) {

        hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: 0,
          y: 0,
          w: 192,
          h: 490,
          color: 0x000000
        })
        
        //-------------------------------------------------------

        let fontArray = Array.from(Array(10), (v, k) => `images/text/${k}.png`)

        let timeArrayAoD = Array.from(Array(10), (v, k) => `images/time/h2${k}.png`)
        let HourArray = watchType == 1 ? Array.from(Array(10), (v, k) => `images/time/h${k}.png`) : Array.from(Array(10), (v, k) => `images/time/${k}.png`)
        let MinuteArray = watchType == 1 ? Array.from(Array(10), (v, k) => `images/time/m${k}.png`) : screenType == aodScreen ? timeArrayAoD : HourArray
        if (screenType == aodScreen) {
          HourArray = watchType == 1 ? Array.from(Array(10), (v, k) => `images/time/m${k}.png`) : timeArrayAoD
          if (watchType == 1) MinuteArray = Array.from(Array(10), (v, k) => `images/time/m2${k}.png`)
        }

        if (watchType == 1) {
          hmUI.createWidget(hmUI.widget.FILL_RECT, {
            x: 29,
            y: 241,
            w: 66,
            h: 44,
            color: 0xffffff,
            show_level: hmUI.show_level.ONLY_AOD
          })

          hmUI.createWidget(hmUI.widget.FILL_RECT, {
            x: screenType == aodScreen ? 95 : 118,
            y: screenType == aodScreen ? 260 : 88,
            w: screenType == aodScreen ? 37 : 65,
            h: screenType == aodScreen ? 24 : 44,
            color: bgColor
          })
        }

        let apath = screenType == aodScreen ? '2' : ''

        //-------------------------------------------------------
        // Время

        const time_group = hmUI.createWidget(hmUI.widget.GROUP, { x: 0, y:15, w: 190, h: 490 });

        const Clock = time_group.createWidget(hmUI.widget.IMG_TIME, {
          hour_zero: 1,
          hour_startX: screenType == aodScreen ? 28 : 8,
          hour_startY: screenType == aodScreen ? 240 : watchType == 0 ? 81 : 88,
          hour_array: HourArray,
          hour_space: screenType == aodScreen ? -1 : watchType == 0 ? 2 : 4,
          hour_align: hmUI.align.LEFT,
          hour_unit_sc: watchType == 0 ? `images/time/unit${apath}.png` : 'images/zero.png',
          hour_unit_tc: watchType == 0 ? `images/time/unit${apath}.png` : 'images/zero.png',
          hour_unit_en: watchType == 0 ? `images/time/unit${apath}.png` : 'images/zero.png',
          minute_zero: 1,
          minute_startX: screenType == aodScreen ? watchType == 0 ? 88 : 96 : watchType == 0 ? 106 : 116,
          minute_startY: screenType == aodScreen ? watchType == 0 ? 240 : 260 : watchType == 0 ? 81 : 87,
          minute_array: MinuteArray,
          minute_space: watchType == 0 ? screenType == aodScreen ? -1 : 2 : screenType == aodScreen ? 0 : -1,
          minute_align: hmUI.align.LEFT,
        })

        //-------------------------------------------------------
        // Дата и день недели

        const offsetY = 5; // for monthes2
        const offsetX = 48;
        const offsetY2 = 5;

        const Date = time_group.createWidget(hmUI.widget.IMG_DATE, {
          day_startX: screenType == aodScreen ? 28 : watchType == 0 ? 109 - offsetX : 118,
          day_startY: screenType == aodScreen ? 300 : watchType == 0 ? 169+offsetY2 : 135,
          day_align: hmUI.align.LEFT,
          day_space: 1,
          day_zero: 1,
          day_en_array: fontArray,
          month_startX: screenType == aodScreen ? 55 : 140 - offsetX,
          month_startY: screenType == aodScreen ? 299 : watchType == 0 ? 168 - offsetY + offsetY2 : 134,
          month_align: hmUI.align.LEFT,
          month_en_array: Array.from(Array(12), (v, k) => `images/monthes2/${k}.png`),
          month_is_character: true
        })

        const weekday_arr = [
          {img: "0", x: 0, y: 0},
          {img: "1", x: 0, y: 1},
          {img: "2", x: 0, y: 2},
          {img: "3", x: 1, y: 0},
          {img: "4", x: 1, y: 1},
          {img: "5_red", x: 1, y: 2},
          {img: "6_red", x: 1, y: 3},
        ];

        const week_group = hmUI.createWidget(hmUI.widget.GROUP, { x: 100, y: 220, w: 190, h: 490 });
        const weekday_offset_x = 35;
        const weekday_offset_y = 33;
        for (const day of weekday_arr) {
          week_group.createWidget(hmUI.widget.IMG, {
            x: 10+weekday_offset_x * day.x,
            y: 10+weekday_offset_y * day.y,
            src: `images/weekdays/${day.img}.png`,
          })
        }

        const time_sensor = hmSensor.createSensor(hmSensor.id.TIME);
        const weekday_highlight_size = 4;
        const weekday_highlight = week_group.createWidget(hmUI.widget.STROKE_RECT, {
          x: 10+weekday_arr[time_sensor.week-1].x * weekday_offset_x-weekday_highlight_size,
          y: 10+weekday_arr[time_sensor.week-1].y * weekday_offset_y-weekday_highlight_size,
          w: 27+weekday_highlight_size*2,
          h: 27+weekday_highlight_size*2,
          color: 16720418,
          line_width: 2,
          radius: 4
        });

        function weekday_update() {
          weekday_highlight.setProperty(hmUI.prop.MORE, {
            x: 10+weekday_arr[time_sensor.week-1].x * weekday_offset_x-weekday_highlight_size,
            y: 10+weekday_arr[time_sensor.week-1].y * weekday_offset_y-weekday_highlight_size,
          });
        }

        time_sensor.addEventListener(hmSensor.event.DAYCHANGE, function() { weekday_update(); });

        //-------------------------------------------------------
        // Статус соединения, bluetooth

        time_group.createWidget(hmUI.widget.IMG_STATUS, {
          x: 10,
          y: 165,
          type: hmUI.system_status.DISCONNECT,
          src: `images/icons/bt2.png`,
          show_level: hmUI.show_level.ONLY_NORMAL
        })

        time_group.createWidget(hmUI.widget.IMG_STATUS, {
          x: 192-40,
          y: 165,
          type: hmUI.system_status.CLOCK,
          src: `images/icons/alarm.png`,
          show_level: hmUI.show_level.ONLY_NORMAL
        })

        //-------------------------------------------------------
        // Батарея

        const battery = hmSensor.createSensor(hmSensor.id.BATTERY)

        hmUI.createWidget(hmUI.widget.TEXT_IMG, {
          x: 190/2-60/2,
          y: 490-23-31,
          w: 60,
          h: 23,
          align_h: hmUI.align.CENTER_H,
          type: hmUI.data_type.BATTERY,
          font_array: fontArray,
          h_space: 1,
          show_level: hmUI.show_level.ONLY_NORMAL
        })

        const angle_offset = 20;

        const battery_bg_arc = hmUI.createWidget(hmUI.widget.ARC, {
          x: 6,
          y: 490-180-5,
          w: 180,
          h: 180,
          start_angle: 0 + angle_offset,
          end_angle: 180 - angle_offset,
          color: DarkColor(greenColor, 25),
          line_width: 15,
          show_level: hmUI.show_level.ONLY_NORMAL,
        })

        const battery_arc = hmUI.createWidget(hmUI.widget.ARC, {
          x: 6,
          y: 490-180-5,
          w: 180,
          h: 180,
          start_angle: 0 + angle_offset,
          end_angle: angle_offset + (180. - angle_offset * 2) * battery.current / 100,
          color: greenColor,
          line_width: 15,
          show_level: hmUI.show_level.ONLY_NORMAL,
        })

        // 31x29
        hmUI.createWidget(hmUI.widget.IMG, {
          x: 190/2 - 31/2+1,
          y: 490-29,
          src: 'images/battery.png'
        })

        function BatteryUpdate() {
          let battery_color = greenColor;
          if (battery.current <= 40) {
            battery_color = yellowColor;
          }
          if (battery.current <= 20) {
            battery_color = redColor;
          }
          battery_bg_arc.setProperty(hmUI.prop.MORE, {
            color: DarkColor(battery_color, 25),
          })
          battery_arc.setProperty(hmUI.prop.MORE, {
            end_angle: angle_offset + (180. - angle_offset * 2) * battery.current / 100,
            color: battery_color,
          })
        }

        BatteryUpdate()
        battery.addEventListener(hmSensor.event.CHANGE, function() { BatteryUpdate() })

        //-------------------------------------------------------
        // Погода

        const weather_group = hmUI.createWidget(hmUI.widget.GROUP, { x: -103, y: 25, w: 190, h: 490 });

        const weather_pos_x = 65;
        const weather_pos_y = 270;

        weather_group.createWidget(hmUI.widget.TEXT_IMG, {
          x: weather_pos_x+50,
          y: weather_pos_y-47,
          w: 70,
          h: 24,
          font_array: Text3Array,
          h_space: 1,
          align_h: hmUI.align.CENTER_H,
          type: hmUI.data_type.WEATHER_CURRENT,
          invalid_image: `images/text3/minus.png`,
          negative_image: `images/text3/minus.png`,
          unit_en: 'images/text3/deg.png',
          show_level: hmUI.show_level.ONLY_NORMAL
        })

        weather_group.createWidget(hmUI.widget.IMG_LEVEL, {
          x: weather_pos_x+55,
          y: weather_pos_y-15,
          image_array: Array.from(Array(29), (v, k) => `images/weather/${k}.png`),
          image_length: 29,
          type: hmUI.data_type.WEATHER,
          show_level: hmUI.show_level.ONLY_NORMAL
        })

        //-------------------------------------------------------
        // Шаги слева вверху

        const steps_group = hmUI.createWidget(hmUI.widget.GROUP, {
          x: 0,
          y: 0,
          w: 190,
          h: 490,
        });

        const steps = hmSensor.createSensor(hmSensor.id.STEP)

        const Steps = steps_group.createWidget(hmUI.widget.TEXT_IMG, {
          x: 190/2-60/2,
          y: 31,
          w: 60,
          h: 23,
          align_h: hmUI.align.CENTER_H,
          type: hmUI.data_type.STEP,
          font_array: fontArray,
          h_space: 1,
          show_level: hmUI.show_level.ONLY_NORMAL,
        })

        steps_group.createWidget(hmUI.widget.ARC, {
          x: 6,
          y: 5,
          w: 180,
          h: 180,
          start_angle: -180 + angle_offset,
          end_angle: 0 - angle_offset,
          color: DarkColor(orangeColor, 25),
          line_width: 15,
          show_level: hmUI.show_level.ONLY_NORMAL,
        })

        const steps_arc = steps_group.createWidget(hmUI.widget.ARC, {
          x: 6,
          y: 5,
          w: 180,
          h: 180,
          start_angle: -180 + angle_offset,
          end_angle: -180 + angle_offset + (180. - angle_offset * 2) * steps.current / steps.target,
          color: orangeColor,
          line_width: 15,
          show_level: hmUI.show_level.ONLY_NORMAL,
        })

        const steps_arc2 = steps_group.createWidget(hmUI.widget.ARC, {
          x: 6,
          y: 5,
          w: 180,
          h: 180,
          start_angle: -180 + angle_offset,
          end_angle: -180 + angle_offset + (180. - angle_offset * 2) * 0.,
          color: yellowColor,
          line_width: 15,
          show_level: hmUI.show_level.ONLY_NORMAL,
        })

        // 31x29
        steps_group.createWidget(hmUI.widget.IMG, {
          x: 190/2 - 31/2+1,
          y: -1,
          src: 'images/sneaker.png'
        })

        steps_group.createWidget(hmUI.widget.TEXT_IMG, {
          x: 190/2-110/2,
          y: 63,
          w: 110,
          h: 23,
          align_h: hmUI.align.CENTER_H,
          type: hmUI.data_type.DISTANCE,
          dot_image: 'images/text/dot.png',
          unit_en: 'images/text/km.png',
          font_array: fontArray,
          h_space: 1,
          show_level: hmUI.show_level.ONLY_NORMAL
        })

        function StepsUpdate() {
          let steps_target = steps.current / steps.target;
          if (steps_target > 1.) {
            if (steps_target > 2.) {
              steps_target = 2.;
            }
            steps_arc2.setProperty(hmUI.prop.MORE, {
              end_angle: -180 + angle_offset + (180. - angle_offset * 2) * (steps_target-1.),
            })
            steps_target = 1.;
          } else {
            steps_arc2.setProperty(hmUI.prop.MORE, {
              end_angle: -180 + angle_offset + (180. - angle_offset * 2) * (0.),
            })
          }
          steps_arc.setProperty(hmUI.prop.MORE, {
            end_angle: -180 + angle_offset + (180. - angle_offset * 2) * steps_target,
          })
        }

        StepsUpdate()
        steps.addEventListener(hmSensor.event.CHANGE, function() { StepsUpdate() })

        //-------------------------------------------------------
        // Таймер справа вверху

        const timer_group = hmUI.createWidget(hmUI.widget.GROUP, {
          x: 0,
          y: 0,
          w: 190,
          h: 490,
        });

        timer_group.createWidget(hmUI.widget.ARC, {
          x: 6,
          y: 5,
          w: 180,
          h: 180,
          start_angle: -180 + angle_offset,
          end_angle: 0 - angle_offset,
          color: DarkColor(blueColor, 25),
          line_width: 15,
          show_level: hmUI.show_level.ONLY_NORMAL,
        })

        const timer_arc = timer_group.createWidget(hmUI.widget.ARC, {
          x: 6,
          y: 5,
          w: 180,
          h: 180,
          start_angle: -180 + angle_offset,
          end_angle: -180 + angle_offset + (180. - angle_offset * 2) * getTimerState2(),
          color: blueColor,
          line_width: 15,
          show_level: hmUI.show_level.ONLY_NORMAL,
        })

        const timer1 = timer_group.createWidget(hmUI.widget.TEXT_IMG, {
          x: 190/2-60/2,
          y: 31,
          w: 60,
          h: 23,
          align_h: hmUI.align.CENTER_H,
          align_v: hmUI.align.CENTER_V,
          font_array: fontArray,
          dot_image: 'images/text/colon.png',
          negative_image: 'images/text/minus.png',
          text: getTimerState1(),
        });

        // 31x29
        timer_group.createWidget(hmUI.widget.IMG, {
          x: 190/2 - 31/2+1,
          y: -1,
          src: 'images/timer.png'
        })

        function TimerUpdate() {
          const state1 = getTimerState1();
          if (state1) {
            timer_group.setProperty(hmUI.prop.VISIBLE, true);
            steps_group.setProperty(hmUI.prop.VISIBLE, false);
            timer1.setProperty(hmUI.prop.TEXT, state1);

            timer_arc.setProperty(hmUI.prop.MORE, {
              end_angle: -180 + angle_offset + (180. - angle_offset * 2) * getTimerState2(),
            })
          } else {
            timer_group.setProperty(hmUI.prop.VISIBLE, false);
            steps_group.setProperty(hmUI.prop.VISIBLE, true);
            timer_arc.setProperty(hmUI.prop.MORE, {
              end_angle: -180 + angle_offset + (180. - angle_offset * 2) * 1.,
            })
          }
        }
        TimerUpdate()
        timer.createTimer(500, 500, () => {
          TimerUpdate()
        });

        //-------------------------------------------------------
        // Измерения

        const heart_y = 380;

        // пульс
        hmUI.createWidget(hmUI.widget.TEXT_IMG, {
          x: 25,
          y: heart_y,
          w: 60,
          h: 23,
          align_h: hmUI.align.CENTER_H,
          type: hmUI.data_type.HEART,
          font_array: fontArray,
          unit_en: 'images/text/heart.png',
          h_space: 1,
          show_level: hmUI.show_level.ONLY_NORMAL
        })

        // spo2
        hmUI.createWidget(hmUI.widget.TEXT_IMG, {
          x: 190-25-60,
          y: heart_y,
          w: 60,
          h: 23,
          align_h: hmUI.align.CENTER_H,
          type: hmUI.data_type.SPO2,
          font_array: fontArray,
          unit_en: 'images/text/spo2.png',
          h_space: 1,
          show_level: hmUI.show_level.ONLY_NORMAL
        })

        //-------------------------------------------------------
        // Зоны для клика

        // таймер
         hmUI.createWidget(hmUI.widget.IMG, {
          x: 0,
          y: 0,
          w: 93,
          h: 80,
          src: 'images/zero.png',
          show_level: hmUI.show_level.ONLY_NORMAL
        })
        .addEventListener(hmUI.event.CLICK_UP, function (info) {
          hmApp.startApp( {appid: 95053, url: "page/index"} )
        })

        // пресеты таймера
        hmUI.createWidget(hmUI.widget.IMG, {
          x: 95,
          y: 0,
          w: 93,
          h: 80,
          src: 'images/zero.png',
          show_level: hmUI.show_level.ONLY_NORMAL
        })
        .addEventListener(hmUI.event.CLICK_UP, function (info) {
          hmApp.startApp( {appid: 95054, url: "page/index"} )
        })

        // календарь
        time_group.createWidget(hmUI.widget.IMG, {
          x: 48,
          y: 167,
          w: 100,
          h: 37,
          src: 'images/zero.png',
          show_level: hmUI.show_level.ONLY_NORMAL
        })
        .addEventListener(hmUI.event.CLICK_UP, function (info) {
          hmApp.startApp( {appid: 29067, url: "page/index"} )
        })

        // календарь 2
        week_group.createWidget(hmUI.widget.IMG, {
          x: 5,
          y: 5,
          w: weekday_offset_x*2+5,
          h: weekday_offset_y*4+5,
          src: 'images/zero.png',
          show_level: hmUI.show_level.ONLY_NORMAL
        })
        .addEventListener(hmUI.event.CLICK_UP, function (info) {
          hmApp.startApp( {appid: 29067, url: "page/index"} )
        })

        // яркость
        hmUI.createWidget(hmUI.widget.IMG, {
          x: 10,
          y: 95,
          w: 80,
          h: 85,
          src: 'images/zero.png',
          show_level: hmUI.show_level.ONLY_NORMAL
        })
        .addEventListener(hmUI.event.CLICK_UP, function (info) {
          hmApp.startApp( {url: 'Settings_lightAdjustScreen', native: true} )
        })

        // фонарик
        hmUI.createWidget(hmUI.widget.IMG, {
          x: 105,
          y: 95,
          w: 80,
          h: 85,
          src: 'images/zero.png',
          show_level: hmUI.show_level.ONLY_NORMAL
        })
        .addEventListener(hmUI.event.CLICK_UP, function (info) {
          hmApp.startApp( {url: 'FlashLightScreen', native: true} )
        })

        // пульс
        hmUI.createWidget(hmUI.widget.IMG_CLICK, {
          x: 190/2-80,
          y: heart_y-30,
          w: 80,
          h: 80,
          src: 'images/zero.png',
          type: hmUI.data_type.HEART,
          show_level: hmUI.show_level.ONLY_NORMAL
        })

        // spo2
        hmUI.createWidget(hmUI.widget.IMG_CLICK, {
          x: 190/2,
          y: heart_y-30,
          w: 80,
          h: 80,
          src: 'images/zero.png',
          type: hmUI.data_type.SPO2,
          show_level: hmUI.show_level.ONLY_NORMAL
        })

        // погода
        weather_group.createWidget(hmUI.widget.IMG_CLICK, {
          x: 105,
          y: 220,
          w: 80,
          h: 90,
          src: 'images/zero.png',
          type: hmUI.data_type.WEATHER,
          show_level: hmUI.show_level.ONLY_NORMAL
        })

        // AOD
        // hmUI.createWidget(hmUI.widget.IMG_CLICK, {
        //   x: 10,
        //   y: 220,
        //   w: 80,
        //   h: 80,
        //   src: 'images/zero.png',
        //   show_level: hmUI.show_level.ONLY_NORMAL
        // })
        // .addEventListener(hmUI.event.CLICK_UP, function (info) {
        //   hmApp.startApp( {url: "Settings_standbyModelScreen", native: true} )
        // })

        //-------------------------------------------------------
        // Штука для обновления виджетов

        hmUI.createWidget(hmUI.widget.WIDGET_DELEGATE, {
        resume_call: function () { 
          StepsUpdate()
          TimerUpdate()
          BatteryUpdate()
          weekday_update();
        },
        pause_call: function () { console.log("ui pause") }
      })
      }
    }

    __$$hmAppManager$$__.currentApp.current.module = DeviceRuntimeCore.WatchFace({
      onInit() {},
      build() {
        init_view()
      },
      onDestory() {}
    })
  })()
} catch (error) {
  console.log(error)
}