/**
* @version $Id$
* @package Abricos
* @copyright Copyright (C) 2008 Abricos All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

/**
 * @module News
 * @namespace Brick.mod.news
 */
var Component = new Brick.Component();
Component.requires = {
    mod:[
         {name: 'sys', files: ['data.js', 'container.js', 'widgets.js', 'wait.js']}
    ]
};
Component.entryPoint = function(){
	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;

	var NS = this.namespace, 
		TMG = this.template;
	
	var API = NS.API;
	
	if (!NS.data){
		NS.data = new Brick.util.data.byid.DataSet('news');
	}
	var DATA = NS.data;
	
	var LW = Brick.widget.LayWait;
	
	
	var initCSS = false,
		buildTemplate = function(w, ts){
		if (!initCSS){
			Brick.util.CSS.update(Brick.util.CSS['news']['list']);
			delete Brick.util.CSS['news']['list'];
			initCSS = true;
		}
		w._TM = TMG.build(ts); w._T = w._TM.data; w._TId = w._TM.idManager;
	};
	
	/**
	 * Панель "Список новостей".
	 * 
	 * @class NewsListPanel
	 */
	var NewsListPanel = function(){
		NewsListPanel.superclass.constructor.call(this, {
			modal: true,
			fixedcenter: true			
		});
	};
	YAHOO.extend(NewsListPanel, Brick.widget.Panel, {
		initTemplate: function(){
			buildTemplate(this, 'panel');
			return this._TM.replace('panel'); 
		},
		onLoad: function(){
			
			this.newsListWidget = new NS.NewsListWidget(this._TM.getEl('panel.container'));
			
			var firstRender = true, __self = this;
			this.newsListWidget.parentRender = this.newsListWidget.render;
			this.newsListWidget.render = function(){
				this.parentRender();
				if (firstRender){
					__self.center();
				}
				firstRender = false;
			};
		},
		destroy: function(){
			this.newsListWidget.destroy();
			NewsListPanel.superclass.destroy.call(this);
		},
		onClick: function(el){
			if (el.id == this._TId['panel']['bclose']){
				this.close(); return true;
			}
			return false;
		}
	});
	
	NS.NewsListPanel = NewsListPanel;	
	
	var NewsListWidget = function(el){
		
		var TM = TMG.build('widget,table,row,rowwait,rowdel,btnpub'), 
			T = TM.data, TId = TM.idManager;
		this._TM = TM, this._T = T, this._TId = TId;
		
		var config = {
			rowlimit: 10,
			tables: {
				'list': 'newslist',
				'count': 'newscount'
			},
			tm: TM,
			paginators: ['widget.pagtop', 'widget.pagbot'],
			DATA: DATA
		};
		NewsListWidget.superclass.constructor.call(this, el, config);    
	};
	
    YAHOO.extend(NewsListWidget, Brick.widget.TablePage, {
    	initTemplate: function(){
    		return this._T['widget'];
    	},
    	renderTableAwait: function(){
    		this._TM.getEl("widget.table").innerHTML = this._TM.replace('table', {
    			'scb': '', 'rows': this._T['rowwait']
    		});
    	},
		renderRow: function(di){
    		return this._TM.replace(di['dd']>0 ? 'rowdel' : 'row', {
    			'dl': Brick.dateExt.convert(di['dl']),
    			'tl': di['tl'],
    			'dp': (di['dp']>0 ? Brick.dateExt.convert(di['dp']) : this._T['btnpub']),
    			'prv': '/news/'+di['id']+'/',
    			'scb': '',
    			'id': di['id']
			});
    	},
    	renderTable: function(lst){
    		this._TM.getEl("widget.table").innerHTML = this._TM.replace('table', {
    			'scb': '', 'rows': lst
    		}); 
    	}, 
    	onClick: function(el){
    		var TM = this._TM, T = this._T, TId = this._TId;
    		
    		switch(el.id){
    		case TId['widget']['refresh']: this.refresh(); return true;
    		case TId['widget']['btnnew']: this.create(); return true;
    		case TId['widget']['rcclear']:
				this.recycleClear();
    			return true;
    		}
		
			var prefix = el.id.replace(/([0-9]+$)/, '');
			var numid = el.id.replace(prefix, "");
			
			switch(prefix){
			case (TId['rowdel']['restore']+'-'): this.restore(numid); return true;
			case (TId['row']['remove']+'-'): this.remove(numid); return true;
			case (TId['row']['edit']+'-'): this.edit(numid); return true;
			case (TId['btnpub']['id']+'-'): this.publish(numid); return true;
			}
			return false;
    	},
    	
		changeStatus: function(commentId){
    		var rows = this.getRows();
    		var row = rows.getById(commentId);
    		row.update({
    			'st': row.cell['st'] == 1 ? 0 : 1,
    			'act': 'status'
    		});
    		row.clearFields('st,act');
    		this.saveChanges();
		},
		_createWait: function(){
			return new LW(this._TM.getEl("widget.table"), true);
		},
		_ajax: function(data){
			var lw = this._createWait(), __self = this;
			Brick.ajax('news',{
				'data': data,
				'event': function(request){
					lw.hide();
					__self.refresh();
				}
			});
		},
		create: function(){
			this.edit(0);
		},
		edit: function(newsid){
			var lw = this._createWait();
			Brick.f('news', 'editor', 'showEditorPanel', newsid, function(){
				lw.hide();
			});
		},
		remove: function(newsid){
			this._ajax({'type': 'news', 'do': 'remove', 'id': newsid});
		},
		restore: function(newsid){
			this._ajax({'type': 'news', 'do': 'restore', 'id': newsid});
		},
		recycleClear: function(){
			this._ajax({'type': 'news', 'do': 'rclear'});
		},
		publish: function(newsid){
			this._ajax({'type': 'news', 'do': 'publish', 'id': newsid});
		}
    });

	NS.NewsListWidget = NewsListWidget;


	API.showNewsListPanel = function(){
		var widget = new NS.NewsListPanel();
		DATA.request(true);
		return widget;
	};
	
	/**
	 * Показать виджет "Список новостей"
	 * 
	 * @method showNewsListWidget
	 * @param {String | HTMLElement} container HTML элемент в котором будет отображен 
	 * виджет.
	 */
	API.showNewsListWidget = function(container){
		var widget = new NS.NewsListWidget(container);
		DATA.request(true);
		return widget;
	};

};
