// ==UserScript==
// @name         Mcmod Helper
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  解决部分在 MCMod 百科编辑时遇到的麻烦事
// @author       Jusolin
// @match        https://www.mcmod.cn/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mcmod.cn
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    /* ============ User Settings ============ */
    // General
    const DELAY_TIME = 2000;
    const SECONDARY_DELAY_TIME = 1000;
    // GUI
    const GUI_NAME = '活体酿造台';
    // autolink
    const CATEGORY_PRIORITY = 0; //['物品/方块', '生物/实体']
    const MOD_PRIORITY_LIST = ['我的世界原版', '血肉重铸', 'Alex 的生物', 'Alex 的洞穴', '超多生物群系'];
    /* ========== End User Settings ========== */
    function print(content) {console.log(content);}
    function after_load(time, func) {
        if (window.frameElement != null) return;
        $(document).load(setTimeout(() => {func()}, time));
    }
    //
    after_load(5000, main);
    let url = window.location.pathname;
    if (/^\/item\/tab\/add\//.exec(url)) {
        after_load(DELAY_TIME, main_GUI);
    } else if (/^login\/$/.exec(url)) {
        after_load(SECONDARY_DELAY_TIME, main_login);
    } else if (/^edit\//.exec(url)) {
        after_load(DELAY_TIME, main_autolink);
    } else { /* empty */ }
    function main() {
        function check_wrap(text) {
            return text == 'text-nowrap';
        }
        let no_wrap_table = document.getElementsByClassName('text-nowrap');
        for (let i in no_wrap_table) {
            let table = no_wrap_table[i];
            let splited = table.className.split(" ");
            let index = splited.findIndex(check_wrap);
            splited[index] = 'text-wrap';
            table.className = splited.join(' ');
            print(table.className);
        }
    }
    function main_GUI() {
        let GUI_changer = document.getElementsByClassName('btn dropdown-toggle btn-light')[0];
        GUI_changer.click();
        let GUI_selector = document.getElementById('item-table-gui-select')[0];
        $('#item-table-gui-select option:contains(' + GUI_NAME + ')').each(function() {
            if ($(this).text() == GUI_NAME) {
                $(this).attr('selected', 'selected');
                return false;
            }
            return true;
        })
        $(GUI_selector).change();
    };
    function main_login() {
        document.getElementById('login-remember').click();
        document.getElementById('login-action-btn').click();
    }
    function main_autolink() {
        let in_process = 0;
        let elements = document.getElementsByClassName('edit-autolink-list');
        function auto_click() {
            function is_in_mod_list(item) {
                for (let i of MOD_PRIORITY_LIST) {
                    if (item.search(i) != -1) {
                        console.log(i);
                        return 1;
                    }
                }
                return 0;
            }
            let nodes = elements[0].childNodes[0].childNodes;
            let priority_list = ['物品/方块', '生物/实体']; //category priority list
            for (let i = 1; i < nodes.length; i++) {
                let childs = nodes[i].childNodes;
                let clickable_child = childs[childs.length - 1];
                let name = clickable_child.title;
                if ((name.search(priority_list[CATEGORY_PRIORITY]) != -1) && (is_in_mod_list(name))) {
                    clickable_child.click();
                    break;
                }
            }
            in_process = 0;
        }
        function check_elements_loaded() {
            if (elements.length && !in_process) {
                auto_click();
                in_process = 1;
            }
        }
        setInterval(check_elements_loaded, 200);
    }
})();