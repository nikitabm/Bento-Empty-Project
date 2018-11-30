// nwjs: undefine define and require because this will interfere with requirejs
(function () {
    if (window.nw && window.require && !navigator.isCocoonJS) {
        // window.require('nw.gui').Window.get().showDevTools();
        
        // undefine require
        if (window.require) {
            window.require = undefined;
        }
        if (window.define) {
            window.define = undefined;
        }
    }
})();