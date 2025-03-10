// ==UserScript==
// @name         Mcmod Helper
// @namespace    http://tampermonkey.net/
// @version      0.0.2
// @description  解决部分在 MCMod 百科编辑时遇到的麻烦事
// @author       Jusolin
// @license      MIT
// @match        https://www.mcmod.cn/*
// @run-at       document-start
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mcmod.cn
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    /* ============ User Settings ============ */ // still learning how to use GM_register_menu
    // general
    const DELAY_TIME = 2000;
    const SECONDARY_DELAY_TIME = 1000;
    const IF_SUPPORT_MCMODDER = true; // set true to make this script compatiable with [mcmodder](https://github.com/Charcoal-Black/Mcmodder)
    // mcmodder_settings
    // wrap_table
    const IF_WRAP_TABLE = false;
    // GUI
    const GUI_NAME = '工作台';
    // autolink
    const CATEGORY_TYPE = 0; //['物品/方块', '生物/实体']
    const MOD_PRIORITY_LIST = ['我的世界原版', '血肉重铸', 'Alex 的生物', 'Alex 的洞穴', '超多生物群系'];
    /* ========== End User Settings ========== */
    function print(content) {console.log(content);}
    function after_load(time, func, if_load = 1) {
        if (window.frameElement !== null || !if_load) return;
        window.onload = setTimeout(() => {func();}, time);
    }
    after_load(5000, main_wrap_table, IF_WRAP_TABLE);
    let url = window.location.pathname;
    if (/^\/item\/tab\/add\//.exec(url)) {
        after_load(DELAY_TIME, main_GUI);
    } else if (/^login\/$/.exec(url)) {
        after_load(SECONDARY_DELAY_TIME, main_login);
    } else if (/^edit\//.exec(url)) {
        after_load(DELAY_TIME, main_autolink);
    } else if (/^\/item\/list\//.exec(url) && IF_SUPPORT_MCMODDER) {
        after_load(1, main_mcmodder);
    } else { /* empty */ }
    function main_wrap_table() {
        function check_wrap(text) {return text == 'text-nowrap';}
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
            if ($(this).text() === GUI_NAME) {
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
        let in_process = false;
        let elements = document.getElementsByClassName('edit-autolink-list');
        function auto_click() {
            function is_in_mod_list(item) {
                for (let i of MOD_PRIORITY_LIST) {
                    if (item.search(i) !== -1) {
                        console.log(i);
                        return true;
                    }
                }
                return false;
            }
            let nodes = elements[0].children[0].children;
            let priority_list = ['物品/方块', '生物/实体']; //category priority list
            for (let i = 1; i < nodes.length; i++) {
                let childs = nodes[i].children;
                let clickable_child = childs[childs.length - 1];
                let name = clickable_child.title;
                if ((name.search(priority_list[CATEGORY_TYPE]) != -1) && (is_in_mod_list(name))) {
                    clickable_child.click();
                    break;
                }
            }
            in_process = false;
        }
        function check_elements_loaded() {
            if (elements.length && !in_process) {
                auto_click();
                in_process = true;
            }
        }
        setInterval(check_elements_loaded, 200);
    }
    function main_mcmodder_itemlist() {
        let main_hide_background_style = 'background-color: unset; border-radius: unset; padding: unset; box-shadow: unset';
        function tweak_header() {
            let element = document.getElementsByClassName('header-container')[0];
            element.style.cssText += '; background-color: #3f484f';
        }
        function tweak_navigator() {
            let element = document.getElementsByClassName('common-nav')[0];
            element.style.cssText = 'margin-top: 50px;';
        }
        function tweak_version_tab() {
            let element = document.getElementsByClassName('item-list-branch-frame')[0];
            let sub_element = element.children[0].children;
            element.style.cssText = main_hide_background_style;
            for (let sub2_element of sub_element) {
                let ele = sub2_element.children[0];
                if (ele.tagName === 'SPAN') {
                    ele.style.cssText = 'background-color: #629B00D0; color: white; text-shadow: 1px 1px 1px #434343';
                } else {
                    ele.style.cssText = 'background-color: #8DCC5A90; color: #578A00';
                }
            }
        }
        function tweak_category_tab() {
            let element = document.getElementsByClassName('common-item-mold-list')[0];
            element.style.cssText = main_hide_background_style;
            let style1 = 'margin-top: 0; margin-bottom: 0';
            let style2 = '; box-shadow: rgba(50, 50, 100, 0.5) 0px 2px 4px 0px';
            let is_first = true;
            for (let sub_element of element.children) {
                sub_element.style.cssText = style1;
                if (is_first) {
                    is_first = false;
                    sub_element.style.cssText += '; margin-left: 0';
                }
                sub_element.style.cssText += style2;
            }
        }
        (function (){
            tweak_header();
            tweak_navigator();
            tweak_version_tab();
            tweak_category_tab();
        })();
    }
    function main_mcmodder() {
        function timeout() {setTimeout(() => {timer();}, 10);}
        function timer() {
            if (document.getElementById('nprogress')) {
                if (/none/.exec(document.getElementById('nprogress').style.cssText)){//document.children[0].className === ' '
                    main_mcmodder_itemlist();
                } else {timeout()}
            } else {timeout()}
        }
        timer();
    }
})();