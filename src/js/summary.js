var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: '{C#MODNAME}', files: ['lib.js']}
    ]
};
Component.entryPoint = function(NS){

    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    NS.SummaryWidget = Y.Base.create('summaryWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance){
            this.set('waiting', true);

            var listConfig = {
                page: 1,
                limit: 3
            };

            appInstance.newsList(listConfig, function(err, result){
                this.set('waiting', false);
                if (!err){
                    this.set('newsList', result.newsList);
                }
                this.renderList();
            }, this);

        },
        renderList: function(){
            this.set('waiting', false);

            var newsList = this.get('newsList');

            if (!newsList){
                return;
            }

            var tp = this.template,
                lst = "";

            tp.toggleView(!!NS.roles.isAdmin, 'managerButtons');

            newsList.each(function(news){
                lst += tp.replace('row', [
                    {
                        published: news.get('published') ?
                            Brick.dateExt.convert(news.get('published')) :
                            tp.replace('notPublish'),
                    },
                    news.toJSON()
                ]);

            }, this);

            tp.setHTML('list', tp.replace('table', {rows: lst}));
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'widget,table,row,notPublish'},
            newsList: {}
        }
    });
};