try {
  (() => {
    __$$hmAppManager$$__.currentApp.app = DeviceRuntimeCore.App({
      globalData: {},
      onCreate(options) {},
      onShow(options) {},
      onHide(options) {},
      onDestory(options) {},
      onDestroy(options) {},
      onError(error) {},
      onPageNotFound(obj) {},
      onUnhandledRejection(obj) {}
    })
  })()
} catch (error) {
  console.log(error)
}
