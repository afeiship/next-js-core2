(function (nx, global) {

  var doc = global.document;
  var isBrowserEnv = !!doc;
  var head = isBrowserEnv && (doc.head || doc.getElementsByTagName('head')[0] || doc.documentElement);
  var Path = nx.amd.Path;
  var Module = nx.amd.Module;
  var STATUS = nx.amd.Status;
  var completeRE = /loaded|complete/;

  nx.declare('nx.amd.Loader', {
    methods: {
      init: function (inPath, inExt, inCallback, inOptions) {
        var path = this.path = inPath || '';
        this.ext = inExt;
        this.module = Module.all[path] = new Module(path);
        this.callback = inCallback || nx.noop;
        this.options = inOptions;
      },
      load: function () {
        var ext = this.ext;
        if (ext) {
          return this[ext]();
        }
        nx.error('The ext ' + ext + ' is not supported.');
      },
      nodejs: function () {
        var path=this.path;
        var result = nx.__currentRequire(path);
        console.log('this.path:->',path);
        console.log('result:->',result);
        var currentModule = Module.current;
        if(/\w/.test(path.charAt(0))){

        }
        this.module.sets({
          result:this.module.set('exports',result),
          path: path,
          dependencies: currentModule.get('dependencies'),
          factory: currentModule.get('factory'),
          status: STATUS.LOADING
        });
        this.module.load(this.callback);
      },
      css: function () {
        var linkNode = doc.createElement('link'),
          currentModule;
        linkNode.rel = 'stylesheet';
        linkNode.href = Path.setExt(this.path, 'css');
        head.appendChild(linkNode);
        currentModule = Module.current;

        this.module.sets({
          exports: linkNode,
          path: this.path,
          dependencies: currentModule.get('dependencies'),
          factory: currentModule.get('factory'),
          status: STATUS.RESOLVED
        });
        this.module.load(this.callback);
      },
      js: function () {
        var scriptNode = doc.createElement('script');
        var supportOnload = "onload" in scriptNode;
        var self = this;
        var currentModule;
        var complete = function (err) {
          scriptNode.onload = scriptNode.onerror = scriptNode.onreadystatechange = null;
          if (err) {
            nx.error('Failed to load module:' + self.path);
          } else {
            currentModule = Module.current;
            self.module.sets({
              path: self.path,
              dependencies: currentModule.get('dependencies'),
              factory: currentModule.get('factory'),
              status: STATUS.LOADING
            });
            self.module.load(self.callback);
          }
        };

        scriptNode.src = Path.setExt(self.path, 'js');
        scriptNode.async = true;
        head.appendChild(scriptNode);
        if (supportOnload) {
          scriptNode.onload = function () {
            complete(null);
          };
        } else {
          scriptNode.onreadystatechange = function (e) {
            if (completeRE.test(scriptNode.readyState)) {
              complete(null);
            } else {
              complete(e);
            }
          };
        }
        scriptNode.onerror = function (e) {
          complete(e);
        };
      }
    }
  });

}(nx, nx.GLOBAL));
