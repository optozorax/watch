(() => {
  var AppCalendar = class {
    columns = [];

    constructor() {
      const time = hmSensor.createSensor(hmSensor.id.TIME);
      this.today = time.year + "-" + String(time.month) + "-" + String(time.day);
      this.currentMonth = time.month;
      this.currentYear = time.year;

      this.yearPosY = 110;
      this.monthPosY = this.yearPosY + 40;
      this.numbersPosY = this.monthPosY + 50;
      this.buttonsHeight = 90;
      this.buttonsColor = 0x303030;
    }

    start() {
      this.todayHighlight = hmUI.createWidget(hmUI.widget.STROKE_RECT, {
        w: 26,
        h: 20,
        color: 16720418,
        line_width: 2,
        x: -20,
        y: -20,
        radius: 4
      });
      this.year = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0,
        y: this.yearPosY,
        w: 192,
        h: 40,
        color: 16777215,
        text_size: 30,
        text: "Hello",
        align_h: hmUI.align.CENTER_H
      });
      this.month = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0,
        y: this.monthPosY,
        w: 192,
        h: 40,
        color: 16777215,
        text_size: 30,
        text: "Hello",
        align_h: hmUI.align.CENTER_H
      });
      for (let i = 0; i < 7; i++) {
        this.columns.push(
          hmUI.createWidget(hmUI.widget.TEXT, {
            x: 5 + 26 * i,
            y: this.numbersPosY,
            w: 26,
            h: 180,
            color: i > 4 ? 0xFFAAAA : 16777215,
            text_size: 16,
            align_h: hmUI.align.CENTER_H,
            text: "0\n1\n2"
          })
        );
      }

      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: 0,
        y: 0,
        w: 192,
        h: this.buttonsHeight,
        radius: 5,
        color: this.buttonsColor
      });
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0,
        y: 0,
        w: 192,
        h: this.buttonsHeight,
        color: 16777215,
        text_size: 50,
        text: "-1",
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
      }).addEventListener(hmUI.event.CLICK_UP, () => {
        this.switchPage(-1);
      });

      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: 0,
        y: 490 - this.buttonsHeight,
        w: 192,
        h: this.buttonsHeight,
        radius: 5,
        color: this.buttonsColor
      });
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0,
        y: 490 - this.buttonsHeight,
        w: 192,
        h: this.buttonsHeight,
        color: 16777215,
        text_size: 50,
        text: "+1",
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
      }).addEventListener(hmUI.event.CLICK_UP, () => {
        this.switchPage(1);
      });

      hmUI.createWidget(hmUI.widget.IMG, {
        x: 0,
        y: this.buttonsHeight,
        w: 192,
        h: 490-this.buttonsHeight*2,
        src: ""
      }).addEventListener(hmUI.event.CLICK_UP, () => {
        const time = hmSensor.createSensor(hmSensor.id.TIME);
        this.today = time.year + "-" + String(time.month) + "-" + String(time.day);
        this.currentYear = time.year;
        this.currentMonth = time.month;
        this.loadContent();
      });

      this.loadContent();
    }

    switchPage(delta) {
      this.currentMonth += delta;
      if (this.currentMonth < 1) {
        this.currentYear--;
        this.currentMonth = 12;
      } else if (this.currentMonth > 12) {
        this.currentYear++;
        this.currentMonth = 1;
      }
      this.loadContent();
    }

    loadContent() {
      const months = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];
      this.year.setProperty(hmUI.prop.TEXT, "" + this.currentYear);
      this.month.setProperty(hmUI.prop.TEXT, months[this.currentMonth-1]);
      const date = new Date(this.currentYear, this.currentMonth - 1);
      const end = new Date(this.currentYear, this.currentMonth);
      const columns = ["ПН\n", "ВТ\n", "СР\n", "ЧТ\n", "ПТ\n", "СБ\n", "ВС\n"];
      const voids = (date.getDay() + 6) % 7;
      for (let i = 0; i < voids; i++)
        columns[i] += "\n";
      let todayX = -20, todayY = -20;
      while (date < end) {
        const column = (date.getDay() + 6) % 7;
        if (date.getMonth() === this.currentMonth - 1) {
          columns[column] += date.getDate();
          const hl = date.getDate() + "." + this.currentMonth;
        }
        columns[column] += "\n";
        const str = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
        if (str == this.today) {
          const columnLines = columns[column].split("\n");
          todayX = 5 + 26 * column;
          todayY = this.numbersPosY + 1 + 24 * (columnLines.length - 2);
        }
        date.setDate(date.getDate() + 1);
      }
      for (let i = 0; i < columns.length; i++) {
        this.columns[i].setProperty(hmUI.prop.TEXT, columns[i]);
      }
      this.todayHighlight.setProperty(hmUI.prop.MORE, {
        x: todayX,
        y: todayY
      });
    }
  };
  var __$$app$$__ = __$$hmAppManager$$__.currentApp;
  var __$$module$$__ = __$$app$$__.current;
  __$$module$$__.module = DeviceRuntimeCore.Page({
    onInit() {
      const cal = new AppCalendar();
      cal.start();
    }
  });
})();
