# -*- coding: utf-8 -*-

def get_manager(thing, manager_name, request):
    manager = getattr(thing, manager_name)
    if callable(manager):
        manager = manager(request)
    return manager

