/**
 * Copyright (c) 2008-2011 The Open Planning Project
 * 
 * Published under the BSD license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */

/**
 * @requires plugins/Tool.js
 */

/** api: (define)
 *  module = gxp.plugins
 *  class = RemoveOverlays
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("gxp.plugins");

/** api: constructor
 *  .. class:: RemoveLayer(config)
 *
 *    Plugin for removing all overlays from the map.
 */
gxp.plugins.SaveDefaultContext = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = gxp_removeoverlays */
    ptype: "gxp_saveDefaultContext",
    
    /** api: config[saveDefaultContextMenuText]
     *  ``String``
     */
    saveDefaultContextMenuText: "Save default context",

    /** api: config[saveDefaultContextActionTip]
     *  ``String``
     */
    saveDefaultContextActionTip: "Save current context as default one",
	
    /** api: config[contextSaveSuccessString]
     *  ``String``
     */
    contextSaveSuccessString: "Context saved succesfully",
    	
    /** api: config[contextSaveFailString]
     *  ``String``
     */
    contextSaveFailString: "Context not saved succesfully",
    
    /** api: config[addResourceButtonText]
     *  ``String``
     */
    addResourceButtonText: "Add Map",
    
    
    /** api: method[addActions]
     */
    addActions: function() {
		
		var saveContext = new Ext.Button({
		        id: "save-context-button",
            menuText: this.saveDefaultContextMenuText,
            iconCls: "gxp-icon-savedefaultcontext",
            disabled: false,
            tooltip: this.saveDefaultContextActionTip,
            handler: function() {
                  var configStr = Ext.util.JSON.encode(app.getState()); 
                  
                  if(this.target.mapId == -1){
                      //
                      // SAVE MAP
                      //
                      this.metadataDialog(configStr);                      
                  }else{
                      //
                      // UPDATE MAP
                      // 
                      //var url = proxy + geoStoreBaseURL + "data/" + this.target.mapId;
                      var url = geoStoreBaseURL + "data/" + this.target.mapId;
                      var method = 'PUT';
                      var contentType = 'application/json';
                      
                      this.save(url, method, contentType, configStr);
                  }
            },
            scope: this
        });
		
        var actions = gxp.plugins.SaveDefaultContext.superclass.addActions.apply(this, [ saveContext ]);        
        
        return actions;
    },
    
    save: function(url, method, contentType, configStr){    
        var mask = new Ext.LoadMask(Ext.getBody(), {msg:"Please wait..."});
        mask.show();
        
        Ext.Ajax.request({
           url: url,
           method: method,
           headers:{
              'Content-Type' : contentType,
              'Accept' : 'application/json, text/plain, text/xml'
           },
           params: configStr,
           scope: this,
           success: function(response, opts){
              mask.hide();
              app.modified = false;
              //modified = false;
              
              this.target.mapId = response.responseText;
              
              var reload = function(buttonId, text, opt){
                  if(buttonId === 'ok'){  
                      var href = location.href;
                      if(href.indexOf('mapId') == -1){
                          if(href.indexOf('?') != -1){
                              window.open(href + '&mapId=' + this.target.mapId, '_self');
                          }else{
                              window.open(href + '?mapId=' + this.target.mapId, '_self');
                          }
                      }
                  } 
              };
    
              Ext.Msg.show({
                   title: this.contextSaveSuccessString,
                   msg: response.statusText + " Map successfully saved",
                   buttons: Ext.Msg.OK,
                   fn: reload,
                   icon: Ext.MessageBox.OK,
                   scope: this
              });
           },
           failure:  function(response, opts){
              mask.hide();
              Ext.Msg.show({
                 title: this.contextSaveFailString,
                 msg: response.statusText + "(status " + response.status + "):  " + response.responseText,
                 buttons: Ext.Msg.OK,
                 icon: Ext.MessageBox.ERROR
              });
           }
        }); 
    },
    
    metadataDialog: function(configStr){
        var enableBtnFunction = function(){
            if(this.getValue() != "")
                Ext.getCmp("resource-addbutton").enable();
            else
                Ext.getCmp("resource-addbutton").disable();
        };
        
        var win = new Ext.Window({
            width: 415,
            height: 200,
            resizable: false,
            //title: "Map Name",
            items: [
                new Ext.form.FormPanel({
                    width: 400,
                    height: 150,
                    items: [
                        {
                          xtype: 'fieldset',
                          id: 'name-field-set',
                          title: "Map Metadata",
                          items: [
                              {
                                    xtype: 'textfield',
                                    width: 120,
                                    id: 'diag-text-field',
                                    fieldLabel: "Name",
                                    listeners: {
                                        render: function(f){
                                            f.el.on('keydown', enableBtnFunction, f, {buffer: 350});
                                        }
                                    }
                              },
                              {
                                    xtype: 'textarea',
                                    width: 200,
                                    id: 'diag-text-description',
                                    fieldLabel: "Description",
                                    readOnly: false,
                                    hideLabel : false                    
                              }
                          ]
                        }
                    ]
                })
            ],
            bbar: new Ext.Toolbar({
                items:[
                    '->',
                    {
                        text: this.addResourceButtonText,
                        iconCls: "gxp-icon-addgroup-button",
                        id: "resource-addbutton",
                        scope: this,
                        disabled: true,
                        handler: function(){      
                            win.hide(); 
                            
                            var mapName = Ext.getCmp("diag-text-field").getValue();        
                            var mapDescription = Ext.getCmp("diag-text-description").getValue(); 
                            
                            var resourceXML = '<Resource><description>' + mapDescription + '</description><metadata></metadata><name>' + mapName + '</name><category><name>MAP</name></category><store><data><![CDATA[ ' + configStr + ' ]]></data></store></Resource>';
                            
                            //var url = proxy + geoStoreBaseURL + "resources";
                            var url = geoStoreBaseURL + "resources";
                            var method = 'POST';
                            var contentType = 'text/xml';              
                                  
                            this.save(url, method, contentType, resourceXML);
                            
                            win.destroy(); 
                        }
                    }
                ]
            })
        });
        
        win.show();
    }
        
});

Ext.preg(gxp.plugins.SaveDefaultContext.prototype.ptype, gxp.plugins.SaveDefaultContext);