frappe.provide('frappe.ui.misc');
frappe.ui.misc.about = function() {
	if(!frappe.ui.misc.about_dialog) {
		var d = new frappe.ui.Dialog({title: __('Frappe Framework')})

		$(d.body).html(repl("<div>\
		<p>"+__("Open Source Web Applications for the Web")+"</p>  \
		<p><i class='icon-globe icon-fixed-width'></i>\
			 Website: <a href='https://frappe.io' target='_blank'>https://frappe.io</a></p>\
	 	<p><i class='icon-github icon-fixed-width'></i>\
			Source: <a href='https://github.com/frappe' target='_blank'>https://github.com/frappe</a></p>\
		<hr>\
		<h4>Versions</h4>\
		<div id='about-app-versions'>Loading versions...</div>\
		<hr>\
		<p class='text-muted'>&copy; 2014 Web Notes Technologies Pvt. Ltd and contributers </p> \
		</div>", frappe.app));

		frappe.ui.misc.about_dialog = d;

		frappe.ui.misc.about_dialog.onshow = function() {
			if(!frappe.versions) {
				frappe.call({
					method: "frappe.get_versions",
					callback: function(r) {
						show_versions(r.message);
					}
				})
			}
		};

		var show_versions = function(versions) {
			var $wrap = $("#about-app-versions").empty();
			$.each(keys(versions).sort(), function(i, key) {
				$('<p><b>'+ key +':</b> ' + versions[key] + '</p>').appendTo($wrap)
			});

			frappe.versions = versions;
		}

	}

	frappe.ui.misc.about_dialog.show();

}