# Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
# MIT License. See license.txt

from __future__ import unicode_literals
import frappe, os, sys
from frappe.modules import load_doctype_module
from frappe.utils.nestedset import rebuild_tree
import statics, render

def sync(app=None):
	if app:
		apps = [app]
	else:
		apps = frappe.get_installed_apps()

	print "Resetting..."
	render.clear_cache()

	# delete all static web pages
	statics.delete_static_web_pages()

	# delete all routes (resetting)
	frappe.db.sql("delete from `tabWebsite Route`")

	print "Finding routes..."
	routes, generators = [], []
	for app in apps:
		routes += get_sync_pages(app)
		generators += get_sync_generators(app)

	sync_pages(routes)
	sync_generators(generators)

	# sync statics
	statics_sync = statics.sync()
	statics_sync.start()

def sync_pages(routes):
	l = len(routes)
	if l:
		for i, r in enumerate(routes):
			r.insert(ignore_permissions=True)
			sys.stdout.write("\rUpdating pages {0}/{1}".format(i+1, l))
			sys.stdout.flush()
		print ""

def sync_generators(generators):
	l = len(generators)
	if l:
		frappe.flags.in_sync_website = True
		for i, g in enumerate(generators):
			doc = frappe.get_doc(g[0], g[1])
			doc.update_sitemap()
			sys.stdout.write("\rUpdating generators {0}/{1}".format(i+1, l))
			sys.stdout.flush()

		frappe.flags.in_sync_website = False
		rebuild_tree("Website Route", "parent_website_route")

		# HACK! update public_read, public_write
		for name in frappe.db.sql_list("""select name from `tabWebsite Route` where ifnull(parent_website_route, '')!=''
			order by lft"""):
			route = frappe.get_doc("Website Route", name)
			route.make_private_if_parent_is_private()
			route.db_update()

		print ""

def get_sync_pages(app):
	app_path = frappe.get_app_path(app)
	pages = []

	path = os.path.join(app_path, "templates", "pages")
	if os.path.exists(path):
		for fname in os.listdir(path):
			fname = frappe.utils.cstr(fname)
			page_name, extn = fname.rsplit(".", 1)
			if extn in ("html", "xml", "js", "css"):
				route_page_name = page_name if extn=="html" else fname

				# add website route
				route = frappe.new_doc("Website Route")
				route.page_or_generator = "Page"
				route.template = os.path.relpath(os.path.join(path, fname), app_path)
				route.page_name = route_page_name
				route.public_read = 1
				controller_path = os.path.join(path, page_name + ".py")

				if os.path.exists(controller_path):
					controller = app + "." + os.path.relpath(controller_path,
						app_path).replace(os.path.sep, ".")[:-3]
					route.controller = controller
					try:
						route.page_title = frappe.get_attr(controller + "." + "page_title")
					except AttributeError:
						pass

				pages.append(route)

	return pages

def get_sync_generators(app):
	generators = []
	for doctype in frappe.get_hooks("website_generators", app_name = app):
		condition, order_by = "", "name asc"
		module = load_doctype_module(doctype)
		if hasattr(module, "condition_field"):
			condition = " where ifnull({0}, 0)=1 ".format(module.condition_field)
		if hasattr(module, "sort_by"):
			order_by = "{0} {1}".format(module.sort_by, module.sort_order)
		for name in frappe.db.sql_list("select name from `tab{0}` {1} order by {2}".format(doctype,
			condition, order_by)):
			generators.append((doctype, name))

	return generators
