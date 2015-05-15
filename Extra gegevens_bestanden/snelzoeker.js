var SnelZoeker = Class.create();
SnelZoeker.prototype = {
	initialize: function(pad){
		new Ajax.Autocompleter("sz_input", "sz_div", pad+"/ajax.jsp", {paramName: "s", MinChars: "2", frequency: 0.15, parameters: "a=o", updateElement: this.openPage, indicator: "lidzoekerspinner"});
	},
	
	openPage: function(input, element){
		$('sz_input').value='';
		window.location.assign(input.getElementsByTagName('a')[0].getAttribute('href'));
	}
}
