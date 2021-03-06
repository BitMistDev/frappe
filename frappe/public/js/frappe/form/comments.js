// Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
// MIT License. See license.txt

frappe.ui.form.Comments = Class.extend({
	init: function(opts) {
		$.extend(this, opts);
		this.make();
	},
	make: function() {
		var me = this;
		this.wrapper =this.parent;
		this.row = $("<div class='row'>").appendTo(this.parent);
		this.input = $('<div class="col-md-10" style="margin-top: 5px;">\
			<textarea style="height: 80px" class="form-control"></textarea></div>')
			.appendTo(this.row)
			.find("textarea");
		this.button = $('<div class="col-md-1">\
			<button class="btn btn-default btn-go" class="col-md-1" style="margin-top: 5px;">\
				<i class="icon-ok"></i></button>\
			</div>')
			.appendTo(this.row)
			.find("button")
			.click(function() {
				me.add_comment(this);
			});
		this.list = $('<div class="comments" style="margin-top: 15px;"></div>')
			.appendTo(this.parent);
	},
	get_comments: function() {
		return this.frm.get_docinfo().comments;
	},
	refresh: function() {
		var me = this;
		if(this.frm.doc.__islocal) {
			this.wrapper.toggle(false);
			return;
		}
		this.wrapper.toggle(true);
		this.list.empty();
		var comments = this.get_comments();
		$.each(comments, function(i, c) {
			if(frappe.model.can_delete("Comment")) {
				c["delete"] = '<a class="close" href="#">&times;</a>';
			} else {
				c["delete"] = "";
			}
			c.image = frappe.user_info(c.comment_by).image || frappe.get_gravatar(c.comment_by);
			c.comment_on = dateutil.comment_when(c.creation);
			c.fullname = frappe.user_info(c.comment_by).fullname;
			c.comment = frappe.markdown(c.comment);

			$(repl('<div class="media col-md-10 comment" data-name="%(name)s">\
					<span class="pull-left avatar avatar-small">\
						<img class="media-object" src="%(image)s">\
					</span>\
					<div class="media-body">%(delete)s\
						<div>%(comment)s</div>\
						<span class="small text-muted">%(fullname)s / %(comment_on)s</span>\
					</div>\
				</div>', c))
				.appendTo(me.list)
				.on("click", ".close", function() {
					var name = $(this).parents(".comment:first").attr("data-name");
					me.delete_comment(name);
					return false;
				})

		});
	},
	add_comment: function(btn) {
		var me = this,
			txt = me.input.val();

		if(txt) {
			var comment = {
				doctype: "Comment",
				comment_doctype: me.frm.doctype,
				comment_docname: me.frm.docname,
				comment: txt,
				comment_by: user
			};

			return frappe.call({
				method: "frappe.widgets.form.utils.add_comment",
				args: {
					doc:comment
				},
				btn: btn,
				callback: function(r) {
					if(!r.exc) {
						me.frm.get_docinfo().comments =
							[r.message].concat(me.get_comments());
						me.frm.toolbar.show_infobar();
						me.input.val("");
						me.refresh();
					}
				}
			});
		}
	},
	delete_comment: function(name) {
		var me = this;
		return frappe.call({
			method: "frappe.client.delete",
			args: {
				doctype: "Comment",
				name: name
			},
			callback: function(r) {
				if(!r.exc) {
					me.frm.get_docinfo().comments =
						$.map(me.frm.get_docinfo().comments,
							function(v) {
								if(v.name==name) return null;
								else return v;
							}
						);
					me.refresh();
					me.frm.toolbar.show_infobar();
				}
			}
		});
	}
})
