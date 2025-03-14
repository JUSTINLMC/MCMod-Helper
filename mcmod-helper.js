// ==UserScript==
// @name         Mcmod Helper
// @namespace    http://tampermonkey.net/
// @version      0.0.3
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
    //const DELAY_TIME = 2000;
    const IF_SUPPORT_MCMODDER = true; // set true to make this script compatiable with [mcmodder](https://github.com/Charcoal-Black/Mcmodder)
    // mcmodder_settings
    // wrap_table
    const IF_WRAP_TABLE = false;
    // GUI
    const GUI_NAME = '工作台'; // disabled when IF_SUPPORT_MCMODDER is true
    // autolink
    const CATEGORY_TYPE = 0; //['物品/方块', '生物/实体']
    const MOD_PRIORITY_LIST = ['我的世界原版', '血肉重铸', 'Alex 的生物', 'Alex 的洞穴', '超多生物群系'];
    /* ========== End User Settings ========== */
    function print(content) {console.log(content);}
    function timer(func, condition) {
        function check(condition) {
            if (typeof(condition) === 'function') {
                return condition();
            } else {
                return condition;
            }
        }
        if (check(condition)) {
            func();
        } else {
            setTimeout(() => {timer(func, condition);}, 10);
        }
    }
    function afterLoad(func, if_load = true, time = 1) {
        if (window.frameElement !== null || !if_load) {return;}
        function get_nprogress() {return document.getElementById('nprogress');}
        window.onload = setTimeout(() => {timer(func, get_nprogress);}, time); //document.children[0].className === ' '
    }
    function conditionedAfterLoad(func, condition) {
        if (window.frameElement !== null) {return;}
        window.onload = () => {timer(func, condition)};
    }
    function titleParser(title) {
        const split = title.split(' - ');
        if (arguments[1]) {return split[0]}; // arguments[1]: only_category_mode
        const regex = {id: /(?<=ID:)\d+/, name_in_parentheses: /(?<=\().+?(?=\))/, short_name: /(?<=\[)\w+(?=\])/, name_before_parentheses: /(?<= ).+(?= \()/, name_before_end: /(?<= ).+$/};
        switch (split.length) {
            case 2:
                return ['mod', split[0], Number(split[1].match(regex.id)), String(split[1].match(regex.short_name)), String(split[1].match(regex.name_before_parentheses)), String(split[1].match(regex.name_in_parentheses))];
            case 3:
                if (!String(split[1].match(regex.name_in_parentheses))) {
                    return [split[0], Number(split[1].match(regex.id)[0]), String(split[1].match(regex.name_before_end)), String(split[2])];
                } else {
                    return [split[0], Number(split[1].match(regex.id)[0]), String(split[1].match(regex.name_before_parentheses)), String(split[1].match(regex.name_in_parentheses)), String(split[2])];
                }
        }
    }
    afterLoad(mainWrapTable, IF_WRAP_TABLE, 5000);
    const url = window.location.pathname;
    const function_load_list = [[/^\/item\/tab\/add\//, mainGUI, true, 3000], [/^login\/$/, mainLogin], [/^\/item\/list\//, main_mcmodder_itemlist, IF_SUPPORT_MCMODDER]]
    function conditionMainAutolink() {
        if (!document.body) {return false;}
        return (document.body.className === 'vsc-initialized');
    }
    const conditioned_function_load_list = [[/\/edit\//, mainAutolink, conditionMainAutolink]];
    for (let list of function_load_list) {
        if (list[0].test(url)) {
            switch (list.length) {
                case 2: afterLoad(list[1]); break;
                case 3: afterLoad(list[1], list[2]); break;
                case 4: afterLoad(list[1], list[2], list[3]); break;
            }
        }
    }
    for (let list of conditioned_function_load_list) {
        if (list[0].test(url)) {conditionedAfterLoad(list[1], list[2]);}
    }
    function mainWrapTable() {
        function check_wrap(text) {return text == 'text-nowrap';}
        const no_wrap_table = document.getElementsByClassName('text-nowrap');
        for (let i in no_wrap_table) {
            const table = no_wrap_table[i];
            const splited = table.className.split(" ");
            const index = splited.findIndex(check_wrap);
            splited[index] = 'text-wrap';
            table.className = splited.join(' ');
        }
    }
    function mainGUI() {
        function main2GUI() {
            const GUI_changer = document.getElementsByClassName('btn dropdown-toggle btn-light')[0];
            GUI_changer.click();
            const GUI_selector = document.getElementById('item-table-gui-select')[0];
            $('#item-table-gui-select option:contains(' + GUI_NAME + ')').each(function() {
                if ($(this).text() === GUI_NAME) {
                    $(this).attr('selected', 'selected');
                    return false;
                }
                return true;
            })
            $(GUI_selector).change();
        }
        (function () {
            if (!IF_SUPPORT_MCMODDER) main2GUI();
        })();
    };
    function mainLogin() {
        document.getElementById('login-remember').click();
        document.getElementById('login-action-btn').click();
    }
    function mainAutolink() {
        let allow_run_autolink = true;
        let allow_rerun_autolink = false;
        function autolinkCheck() {
            return (!!document.getElementsByClassName('edit-autolink-list').length) && (!!document.getElementsByClassName('edit-autolink-seach').length);
        }
        function main2Autolink(autolink_list = document.getElementsByClassName('edit-autolink-list')[0]) {
            let autolink_search = document.getElementsByClassName('edit-autolink-seach');
            function isInCategoryList(item) {
                let split_0 = titleParser(item, true);
                let regex = new RegExp(category_priority_list[CATEGORY_TYPE]);
                return regex.test(split_0);
            }
            function isInModList(item) {
                let split = titleParser(item);
                for (let i of MOD_PRIORITY_LIST) {
                    if (item.search(split[2]) !== -1) {
                        console.log(i);
                        return true;
                    }
                }
                return false;
            }
            let input = autolink_search[0].children[0].value;
            function regexItemNameTest(string) {
                let input_word_split = input.replaceAll('_', ' ').split(':');
                let input_word = (input_word_split.length === 1) ? input_word_split[0] : input_word_split[1];
                let regex = new RegExp(input_word, 'i');
                let split = titleParser(string);
                switch (split.length) {
                    case 4:
                        return regex.test(split[2]);
                    case 5:
                        return (regex.test(split[2]) || regex.test(split[3]));
                }
            }
            let elements = autolink_list.children[0].children;
            let elements_length = document.getElementsByClassName('limit').length ? (elements.length - 1) : elements.length;
            let i_priority = -1;
            let li_elements, target_element, title;
            const category_priority_list = ['物品/方块', '生物/实体'];
            for (let i = 1; i < elements_length; i++) {
                li_elements = autolink_list.children[0].children[i].children;
                target_element = li_elements[li_elements.length - 1];
                title = target_element.title;
                //print(title)
                if ((isInCategoryList(title)) && (isInModList(title))) {
                    print('conditioned title:' + title)
                    if (regexItemNameTest(title)) {
                        target_element.click();
                        allow_run_autolink = true;
                        return;
                    }
                    if (i_priority === -1) {i_priority = i;}
                }
            }
            if (i_priority !== -1) {
                li_elements = autolink_list.children[0].children[i_priority].children;
                li_elements[li_elements.length - 1].click();
                allow_run_autolink = true;
                return;
            }
            if (input.search(':') === -1) {
                input = 'minecraft:' + input;
                document.getElementsByClassName('edit-autolink-seach')[0].children[0].value = input;
                document.getElementsByClassName('edit-autolink-seach')[0].children[1].click();
                allow_rerun_autolink = true;
            }
        }
        let autolink_list_children;
        function checkStateAndPerform() {
            function newElementProvider() {
                if (document.getElementsByClassName('edit-autolink-list').length) {
                    let now_autolink_list_children = document.getElementsByClassName('edit-autolink-list')[0].children[0].children;
                    if ((now_autolink_list_children !== autolink_list_children) && (autolink_list_children !== undefined)) {
                        autolink_list_children = document.getElementsByClassName('edit-autolink-list')[0].children[0].children;
                        return document.getElementsByClassName('edit-autolink-list')[0];
                    }
                    autolink_list_children = document.getElementsByClassName('edit-autolink-list')[0].children[0].children;
                }
            }
            let new_autolink_list = newElementProvider();
            if ((allow_rerun_autolink) && (new_autolink_list !== undefined)) {// && (autolink_list_length !== Updatedautolink_list_length)
                allow_rerun_autolink = false;
                function tmp() {
                    main2Autolink(new_autolink_list);
                }
                timer(tmp, autolinkCheck);
                autolink_list_children = undefined;
            }
            if (autolinkCheck() === true || !allow_run_autolink) {
                return;
            }
            if (allow_run_autolink) {
                allow_run_autolink = false;
                timer(main2Autolink, autolinkCheck);
            }
        }
        setInterval(checkStateAndPerform, 200);
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
})();