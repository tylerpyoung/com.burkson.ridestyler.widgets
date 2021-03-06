//Template HTML
var vsm_template = '<div id="vsm_modal_base" class="vsm-modal vsm-hide vsm-fade" style="z-index: 9999;" tabindex="-1" role="dialog"> <div class="vsm-modal-dialog"> <div class="vsm-modal-content"> <div class="vsm-modal-header"> <button type="button" class="vsm-close"> </button> </div><div class="vsm-modal-body vsm-option-body vsm-list-body"> <a href="javascript:void(0);" class="vsm-back-link vsm-back-step"> <i class="vsm-back-arrow"></i> </a> <div class="vsm-in-progress"> <p class="vsm-header vsm-center"></p><div class="vsm-line-step center-piece vsm-columns"> </div><div class="vsm-list-container"> <i class="vsm-loaderIcon" alt="Loading options"></i> </div></div><div class="vsm-final"> <div class="center-piece vsm-line-step vsm-columns vehicle-result-wrap"> <div class="vsm-column-2 vsm-before"></div><div class="vsm-column-2 no-style"><i class="dot-style dot-before active"></i></div><p class="vehicle-result-name"></p><p class="vehicle-result-size"></p></div> <div class="center-piece vehicle-image-wrap"> <div style="position: relative; text-align: center; min-height: 120px;"> <i class="vsm-loaderIcon" alt="Loading an image of your vehicle"></i> <img src="" alt="" class="vsm-vehicle-display" style="display: none;"> </div><a href="javascript:void(0);" class="vsm-btn vsm-btn-gray vsm-full-width vsm-find"></a> </div></div></div></div></div></div>';

var _vsmModalIDCounter = 0;
function RideStylerVehicleSelectionModal(options) {
    var infoArray = [], //Keep track of selected options info
    dataArray = [], //Keep track of selected options data (data sent to Vehicle/Select endpoint)
    modalArray = [], //Keep track of modal screen generated by this instance
    disCountinued = false; //Decide whether or not continue to next modal screen

    //Similar to $.extend
    function extend(out) {
        out = out || {};

        for (var i = 1; i < arguments.length; i++) {
            if (!arguments[i])
                continue;

            for (var key in arguments[i]) {
                if (arguments[i].hasOwnProperty(key))
                out[key] = arguments[i][key];
            }
        }

        return out;
    };

    // Extend default settings
    options = extend({
        ConfirmButtonText: 'Confirm Vehicle',
        GroupOptions: false,
        IncludeOETireOption: false,
        YearScreenColumns: 3,
        MakeScreenColumns: 2,

        container: document.body,

        afterBackClicked: null,
        afterOptionSelected: null,
        callback: null
    }, options);

    //Check if transition is supported, Boolean
    var transitionSupport = (function(){
        var thisBody = document.body || document.documentElement,
        thisStyle = thisBody.style,
        support = thisStyle.WebkitTransition !== undefined || thisStyle.MozTransition !== undefined || thisStyle.OTransition !== undefined || thisStyle.transition !== undefined;

        return support;
    })();

    // add onTransitionEndOnce to HTMLElement
    (function() {
        var i,
        el = document.createElement('div'),
        transitions = {
            'transition':'transitionend',
            'OTransition':'otransitionend',
            'MozTransition':'transitionend',
            'WebkitTransition':'webkitTransitionEnd'
        };

        var transitionEnd = '';
        for (i in transitions) {
            if (transitions.hasOwnProperty(i) && el.style[i] !== undefined) {
                transitionEnd = transitions[i];
                break;
            }
        }

        HTMLElement.prototype.onTransitionEndOnce = function(callback) {
            if (transitionEnd === '') {
                callback();
                return this;
            }
            var transitionEndWrap = function(e) {
                callback();
                e.target.removeEventListener(e.type, transitionEndWrap);
            };
            this.addEventListener(transitionEnd, transitionEndWrap, false);
            return this;
        };
    }());

    /**
     * Add certain class to elements
     * @private
     * @param  {Element|[Element]} elements - Element(s) to search
     * @param  {String}  myClass - Class name to add
     * @return void
     */
    function addClass(elements, myClass) {
        if (!elements) { return; }
        if (typeof(elements) === 'string') elements = document.querySelectorAll(elements);
        else if (elements.tagName) elements=[elements];
        // add class to all chosen elements
        for (var i=0; i<elements.length; i++) {
            if (elements[i].className.trim() == '') elements[i].className = myClass;
            else if ((' '+elements[i].className+' ').indexOf(' '+myClass+' ') < 0) {
                // add class
                elements[i].className += ' ' + myClass;
            }
        }
    }

    /**
     * Remove certain class from elements
     * @private
     * @param  {Element|[Element]} elements - Element(s) to search
     * @param  {String}  myClass - Class name to match against
     * @return void
     */
    function removeClass(elements, myClass) {
        if (!elements) { return; }
        if (typeof(elements) === 'string') elements = document.querySelectorAll(elements);
        else if (elements.tagName) elements=[elements];
        var reg1 = new RegExp(' '+myClass+' ','g');
        var reg2 = new RegExp('(^)'+myClass+'($| )','g');
        var reg3 = new RegExp('(^| )'+myClass+'($)','g');
        // remove class from all chosen elements
        for (var i=0; i<elements.length; i++) {
            elements[i].className = elements[i].className.replace(reg1,' ');
            elements[i].className = elements[i].className.replace(reg2,'');
            elements[i].className = elements[i].className.replace(reg3,'');

            if (elements[i].className.trim() == '') elements[i].removeAttribute('class');
        }
    }

    /**
     * Get the closest matching element up the DOM tree.
     * @private
     * @param  {Element} element - Starting element
     * @param  {String}  selector Selector to match against
     * @return {Boolean|Element}  Returns null if no match found
     */
    function getClosest(element, selector) {
        // Element.matches() polyfill
        if (!Element.prototype.matches) {
            Element.prototype.matches =
            Element.prototype.matchesSelector ||
            Element.prototype.mozMatchesSelector ||
            Element.prototype.msMatchesSelector ||
            Element.prototype.oMatchesSelector ||
            Element.prototype.webkitMatchesSelector ||
            function(s) {
                var matches = (this.document || this.ownerDocument).querySelectorAll(s),
                    i = matches.length;
                while (--i >= 0 && matches.item(i) !== this) {}
                return i > -1;
            };
        }

        // Get closest match
        for ( ; element && element !== document; element = element.parentNode ) {
            if ( element.matches( selector ) ) return element;
        }

        return null;
    };

    function createBackdrop() {
        var existingBackdrop = document.getElementById('vsm-backdrop');
        if (!existingBackdrop) {
            var backDrop = document.createElement('div');
            backDrop.id = 'vsm-backdrop';
            backDrop.style.opacity = 0;
            backDrop.style.transition = 'opacity linear .3s';
            getModalContainer().appendChild(backDrop);

            showBackdrop();
        }
    }

    function showBackdrop() {
        var existingBackdrop = document.getElementById('vsm-backdrop');
        if (!existingBackdrop) {
            createBackdrop();
        }
        setTimeout(function(){
            existingBackdrop.style.opacity = 0.55
            existingBackdrop.onTransitionEndOnce(function(){});
        }, 0);
    }

    function hideBackdrop() {
        var existingBackdrop = document.getElementById('vsm-backdrop');
        if (existingBackdrop) {
            existingBackdrop.style.opacity = 0;
            existingBackdrop.onTransitionEndOnce(function(){
                existingBackdrop.parentNode.removeChild(existingBackdrop);
            });
        }
    }

    function hideModals() {
        var allModals = document.querySelectorAll('.vsm-modal:not(#vsm_modal_base)'),
        currentBase = document.querySelectorAll('.vsm-modal.in')[0];

        var copyOfArray = infoArray.slice(0), copyOfDataArray = dataArray.slice(0);

        infoArray = [];
        dataArray = [];
        disCountinued = true;

        if (modalArray.indexOf(currentBase.getAttribute('id')) > -1) {
            currentBase.style.opacity = 0;
            currentBase.onTransitionEndOnce(function(){
                [].forEach.call(allModals, function (thisModal) {
                    var thisID = thisModal.getAttribute('id');
                    if (modalArray.indexOf(thisID) > -1) {
                        thisModal.parentNode.removeChild(thisModal);
                    }
                });

                var infoBaseObj = {};

                for (var i = 0; i < copyOfArray.length; i++) {
                  var splittedArray = copyOfArray[i].split(':');
                  if (splittedArray.length == 2) {
                      infoBaseObj[splittedArray[0]] = splittedArray[1];
                  }
                }

                if (options.callback && typeof options.callback == 'function') {
                    var outObj = {
                        FinalSelectionMade: false,
                        Vehicle: infoBaseObj,
                        FullSelectionData: copyOfDataArray
                    }
                    options.callback(outObj);
                }
                else {
                    console.warn('No callback function provided.');
                }
            });
            hideBackdrop();
            removeClass(document.body, 'vsm-modal-open');
        }
        else {
            console.warn('This vsm instance is not shown yet.');
        }
    }

    /**
     * Return the container that modals should be appended to
     */
    function getModalContainer() {
        if (typeof options.container === 'function') return options.container();

        if (options.container) return options.container;

        return document.body;
    }

    /*Load HTML code and append to body*/
    function loadBase() {
        var existingModal = document.getElementById('vsm_modal_base');
        if (!existingModal) {
            var divEle = document.createElement('div');
            divEle.innerHTML = vsm_template;
            getModalContainer().appendChild(divEle.firstChild);
        }
    }

    /**
     * Generate and prepare modal screen
     * @private
     * @param  {Function} prepareFunction - The function to prepare the modal
     * @param  {Object} prepareFunctionOptions - Options to pass in
     * @param  {Object} transitionModal - The modal screen to transition to
     * @return {Element}  Returns the prepared modal
     */
    function base(prepareFunction, prepareFunctionOptions, transitionModal) {
        var modalBase = document.getElementById('vsm_modal_base');
        if (!modalBase) return undefined;
        //Make a copy of #vsm_modal_base
        var modalBaseCopy = modalBase.cloneNode(true);

        //Override id of modalBaseCopy and append to body
        modalBaseCopy.id = 'vsm_modal_' + _vsmModalIDCounter;
        modalArray.push('vsm_modal_' + _vsmModalIDCounter);
        modalBaseCopy.className += ' vsm_modal_' + _vsmModalIDCounter;
        getModalContainer().appendChild(modalBaseCopy);

        //Setup transition
        if (typeof(transitionModal) !== 'undefined') {
            prepareFunctionOptions = extend({
                backModal: transitionModal,
                thisModal: modalBaseCopy
            }, prepareFunctionOptions);

            var backLinks = modalBaseCopy.querySelectorAll('.vsm-back-step');
            [].forEach.call(backLinks, function (backLink) {
                var backHandler = function(e){
                    e.target.removeEventListener(e.type, backHandler);
                    var bm = prepareFunctionOptions.backModal,
                    bc = prepareFunctionOptions.thisModal;
                    transitionToModal(bm, bc, true)
                    .done(
                        function(){
                            if (infoArray.length) infoArray.pop();
                            if (dataArray.length) dataArray.pop();
                            if (bc.parentNode) bc.parentNode.removeChild(bc);

                            if (options.afterBackClicked && typeof options.afterBackClicked == 'function') {
                                var infoBaseObj = {};

                                for (var i = 0; i < infoArray.length; i++) {
                                  var splittedArray = infoArray[i].split(':');
                                  if (splittedArray.length == 2) {
                                      infoBaseObj[splittedArray[0]] = splittedArray[1];
                                  }
                                }

                                var outInfoObj = {
                                    FullSelection: infoBaseObj,
                                    FullSelectionData: dataArray
                                }

                                options.afterBackClicked(outInfoObj);
                            }
                        }
                    )
                }
                backLink.addEventListener('click', backHandler, false);
            });
        }

        //Call the prepare function to initialize the new modal
        if (typeof prepareFunction === "function") prepareFunction(modalBaseCopy, prepareFunctionOptions);

        //bind click event to close the modal
        var closeButtons = modalBaseCopy.querySelectorAll('.vsm-close');
        [].forEach.call(closeButtons, function (closeButton) {
            closeButton.onclick = function(){
                hideModals();
            };
        });

        _vsmModalIDCounter++;

        return modalBaseCopy;
    }

    /**
     * Transition between modal
     * @private
     * @param  {Element} toModal - The modal to transition to
     * @param  {Element} fromModal - The current modal to transition from
     * @param  {Boolean} backwards - set to true, if transition from higher index to lower index
     * @return {RideStylerPromise} - Returns a promise that will resolve when the transition is complete
     */
    function transitionToModal(toModal, fromModal, backwards) {
        backwards = !! backwards;

        if (!toModal || !fromModal)
            return;

        /** @type {RideStylerPromise} */
        var fromAnimatePromise = ridestyler.promise(),
            toAnimatePromise = ridestyler.promise();

        if (!backwards) {
            var fromZ = parseInt(fromModal.style.zIndex, 10) || 0,
                toZ = parseInt(toModal.style.zIndex, 10) || 0;
            if (toZ <= fromZ) toZ = fromZ + 1;
            toModal.style.zIndex = toZ;
        }

        if (transitionSupport) {
            if (backwards) {
                toModal.style.display = 'block';
                addClass(toModal, 'in');

                toAnimatePromise.resolve();

                setTimeout(function() {
                    removeClass(fromModal, 'in');
                    fromModal.onTransitionEndOnce(function(){
                        fromModal.style.display = 'none';
                        fromAnimatePromise.resolve();
                    })
                }, 50);
            }
            else {
                toModal.style.display = 'block';

                setTimeout(function() {
                    addClass(toModal, 'in');
                    toModal.onTransitionEndOnce(function(){
                        fromModal.style.display = 'none';
                        removeClass(fromModal, 'in');

                        toAnimatePromise.resolve();
                        fromAnimatePromise.resolve();
                    })
                }, 50);
            }
        }
        else {
            if (backwards) {
                toModal.style.display = 'block';
                addClass(toModal, 'in');

                removeClass(fromModal, 'in');
                fromModal.style.display = 'none';
            }
            else {
                toModal.style.display = 'block';
                addClass(toModal, 'in');

                fromModal.style.display = 'none';
                removeClass(fromModal, 'in');
            }

            toAnimatePromise.resolve();
            fromAnimatePromise.resolve();
        }

        var allPromise = ridestyler.promise();
        var onPromiseChange = function () {
            var toState = toAnimatePromise.state(),
                fromState = fromAnimatePromise.state();

            // Still waiting for resolution
            if (toState === 0 || fromState === 0) return;

            // One promise has been rejected but the other is resolved
            if (toState === 2 || fromState === 2) return allPromise.reject();

            // Both promises are resolved
            allPromise.resolve();
        };

        toAnimatePromise.always(onPromiseChange);
        fromAnimatePromise.always(onPromiseChange);

        return allPromise;
    }

    /**
     * Modal preparation: Process the vehicle select request
     * @private
     * @param  {Element} modal - The modal to prepare
     * @return void
     */
    function requestStep(modal, stepOptions) {
        var request = {
            Selection: dataArray
        };

        if (stepOptions && stepOptions.bestConfiguration) {
            showSelection(modal, stepOptions.bestConfiguration);
        }
        else
            ridestyler.ajax.send({
                action: 'Vehicle/Select',
                data: request,
                callback: function (response) {
                    if (response.Success) {
                        if (response.BestConfiguration) {
                            if (options.IncludeOETireOption) {
                                ridestyler.ajax.send({
                                    action: 'Vehicle/GetTireOptionDetails',
                                    data: {'VehicleConfiguration': response.BestConfiguration.Value},
                                    bestConfiguration: response.BestConfiguration,
                                    callback: function (detailResponse) {
                                        if (detailResponse.Success) {
                                            var details = detailResponse.Details,
                                            bestConfiguration = this.bestConfiguration;
                                            if (details.length == 1) {
                                                var detailString = (function (detail) {
                                                    var f = detail.Front['Description'], r = detail.Rear['Description'];
                                                    if (f==r) return f;
                                                    else return "F: " + f + " R: " + r;
                                                })(details[0]);
                                                bestConfiguration.TireOptionBasic = {TireOptionID: details[0]['TireOptionID'], TireOptionString: detailString};
                                                showSelection(modal, bestConfiguration);
                                            }
                                            else {
                                                var optionMenu = {
                                                    Groups: null,
                                                    Description: 'Select Your Tire Size',
                                                    Title: 'Tire Size',
                                                    Key: 'tireoption',
                                                    Options: []
                                                }
                                                for (var i = 0; i < details.length; i++) {
                                                    var detailString = (function (detail) {
                                                        var f = detail.Front['Description'], r = detail.Rear['Description'];
                                                        if (f==r) return f;
                                                        else return "F: " + f + " R: " + r;
                                                    })(details[i]);
                                                    optionMenu.Options.push({Group: null, Label: detailString, Value: details[i]['TireOptionID']});
                                                }
                                                updateModal(modal, optionMenu, bestConfiguration);
                                            }
                                        }
                                        else showSelection(modal, bestConfiguration);
                                    }
                                });
                            }
                            else
                                showSelection(modal, response.BestConfiguration);
                        }
                        else {
                            updateModal(modal, response.Menu);
                        }
                    }
                }
            });
    }

    /**
     * Modal preparation: Update modal content
     * @private
     * @param  {Element} modal - The modal to prepare
     * @param  {Object} menu - Menu object to pass in for modal content update
     * @return void
     */
    function updateModal(modal, menu, bestConfiguration) {
        var itemListContainer = modal.querySelectorAll('.vsm-list-container')[0],
        headerElement = modal.querySelectorAll('.vsm-header')[0],
        bodyElement = modal.querySelectorAll('.vsm-modal-body')[0],
        vsmLinkStyle = modal.querySelectorAll('.vsm-line-step')[0],
        finalScreen = modal.querySelectorAll('.vsm-final')[0];

        var menuOptions = menu.Options,
        menuKey = menu.Key,
        menuTitle = menu.Title,
        menuGroups = menu.Groups;

        var onListItemSelected = function(o) {
            var optionValue = o.getAttribute('data-optionvalue');
            var optionKey = o.getAttribute('data-optionkey');
            var optionLabel = o.getAttribute('data-optionlabel');
            var optionTitle = o.getAttribute('data-menutitle');
            dataArray.push(optionKey + ':' + optionValue);
            infoArray.push(optionTitle + ':' + optionLabel);

            if (options.afterOptionSelected && typeof options.afterOptionSelected == 'function') {
                var infoBaseObj = {};

                for (var i = 0; i < infoArray.length; i++) {
                    var splittedArray = infoArray[i].split(':');
                    if (splittedArray.length == 2) {
                        infoBaseObj[splittedArray[0]] = splittedArray[1];
                    }
                }

                var outInfoObj = {
                    CurrentSelection: {},
                    FullSelection: infoBaseObj,
                    FullSelectionData: dataArray
                }

                outInfoObj.CurrentSelection[optionTitle] = optionLabel;

                options.afterOptionSelected(outInfoObj);
            }

            if (!disCountinued) {
                var transitionOption = {};
                if (optionKey == 'tireoption' && bestConfiguration) {
                    bestConfiguration.TireOptionBasic = {
                        TireOptionID: optionValue,
                        TireOptionString: optionLabel
                    };
                    transitionOption.bestConfiguration = bestConfiguration;
                }
                transitionToModal(
                    base(requestStep, transitionOption, modal),
                    modal
                );
            }
            else {
                return;
            }
        },
        buildListItem = function(optObj) {
            var optionLabel = optObj.Label,
            optionValue = optObj.Value;
            if (typeof optionLabel === 'undefined' || typeof optionValue === 'undefined') {
                return undefined;
            }

            var optionBtn = document.createElement('a'),
            optionText = document.createTextNode(optionLabel);
            optionBtn.className = 'vsm-option-item vsm-btn vsm-btn-gray';
            optionBtn.href = 'javascript:void(0)';
            optionBtn.setAttribute('data-optionvalue', optionValue);
            optionBtn.setAttribute('data-optionlabel', optionLabel);
            optionBtn.appendChild(optionText);

            optionBtn.onclick = function(){
                onListItemSelected(this);
            };
            return optionBtn;
        },
        buildListHeader = function(headerText) {
            var menuSubHeader = document.createElement('p'),
            menuSubHeaderText = document.createTextNode(headerText);
            menuSubHeader.className = 'vsm-group-title';
            menuSubHeader.appendChild(menuSubHeaderText);

            return menuSubHeader;
        };

        //In progress, removing the final screen element from loaded modal
        finalScreen.parentNode.removeChild(finalScreen);
        addClass(vsmLinkStyle, 'vsm-single-step');

        //Create right-side progress bar
        var divELe = document.createElement('div'),
        dotEle = document.createElement('i'),
        spanEle = document.createElement('span');
        divELe.className = 'vsm-column-2';
        dotEle.className = 'dot-style dot-before active';
        spanEle.className = 'dot-info dot-info-before active';
        //spanEle.innerHTML = menuTitle;
        divELe.appendChild(dotEle);
        divELe.appendChild(spanEle);

        //Create left-side progress info
        if (!dataArray.length) {
            var notStyleDiv = document.createElement('div');
            notStyleDiv.className = 'vsm-column-2 no-style';
            vsmLinkStyle.appendChild(notStyleDiv);
            vsmLinkStyle.appendChild(divELe);
        }
        else {
            addClass(bodyElement, 'vsm-has-back');
            var notStyleDiv = document.createElement('div');
            /*cellEle = document.createElement('span'),*/
            /*infoEle = document.createElement('span');*/
            notStyleDiv.className = 'vsm-column-2 vsm-before';
            /*cellEle.className = 'vsm-table-cell';
            infoEle.className = 'vsm-selected-info';
            cellEle.appendChild(infoEle);
            notStyleDiv.appendChild(cellEle);*/
            var infoBaseArray = infoArray.map(function (ele) {
                return ele && ele.split(':').length === 2 ? ele.split(':')[1] : '';
            });
            /*infoEle.innerHTML = infoBaseArray.join(' ');*/
            spanEle.innerHTML = infoBaseArray.join(' ');
            vsmLinkStyle.appendChild(notStyleDiv);
            vsmLinkStyle.appendChild(divELe);

        }
        headerElement.innerHTML = menu.Description;

        //Clear the container
        while (itemListContainer.firstChild) {
            itemListContainer.removeChild(itemListContainer.firstChild);
        }

        if (menuOptions.length) {
            var groupWrap = document.createElement('div');
            groupWrap.className = 'vsm-group-wrap center-piece';
            itemListContainer.appendChild(groupWrap);

            if (options.GroupOptions && menuGroups) {
                var menuGroupedOptions = {};
                for (var i = 0; i < menuOptions.length; i++) {
                    var thisMenuOption = menuOptions[i],
                    thisMenuOptionGroup = thisMenuOption.Group;
                    if (thisMenuOptionGroup) {
                        //If Group value of this option is not null or undefined
                        if (!menuGroupedOptions[thisMenuOptionGroup]) {
                            menuGroupedOptions[thisMenuOptionGroup] = [thisMenuOption];
                        }
                        else {
                            menuGroupedOptions[thisMenuOptionGroup].push(thisMenuOption);
                        }
                    }
                    else {
                        //If Group value of this option is null or undefined, put them in Ungrouped array
                        //May never happen, more like an error handling
                        if (!menuGroupedOptions['_ungrouped']) {
                            menuGroupedOptions['_ungrouped'] = [thisMenuOption];
                        }
                        else {
                            menuGroupedOptions['_ungrouped'].push(thisMenuOption);
                        }
                    }
                }
                //Go through known Groups before checking ungrouped options
                for (var j = 0; j < menuGroups.length; j++) {
                    var menuGroup = menuGroups[j];
                    var subGroup = menuGroupedOptions[menuGroup];
                    if (subGroup) {
                        var groupList = document.createElement('div'),
                        columnClass = 'vsm-one-container';
                        if (menu.Key == 'year' && menuOptions.length > 10) {
                            if (options.YearScreenColumns == 2) columnClass = 'vsm-half-container';
                            if (options.YearScreenColumns >= 3) columnClass = 'vsm-third-container';
                        }
                        if (menu.Key == 'make' && menuOptions.length > 10) {
                            if (options.MakeScreenColumns >= 2) columnClass = 'vsm-half-container';
                        }
                        groupList.className = 'vsm-group-list ' + columnClass;
                        groupWrap.appendChild(buildListHeader(menuGroup));
                        groupWrap.appendChild(groupList);

                        for (var i = 0; i < subGroup.length; i++) {
                            var listItem = buildListItem(subGroup[i]);
                            if (typeof listItem !== 'undefined') {
                                listItem.setAttribute('data-optionkey', menuKey);
                                listItem.setAttribute('data-menutitle', menuTitle);
                                groupList.appendChild(listItem);
                            }
                        }
                    }
                }
                //Check if Ungrouped options exist
                if (menuGroupedOptions['_ungrouped']) {
                    var groupList = document.createElement('div'),
                    columnClass = 'vsm-one-container';
                    if (menu.Key == 'year' && menuOptions.length > 10) {
                        if (options.YearScreenColumns == 2) columnClass = 'vsm-half-container';
                        if (options.YearScreenColumns >= 3) columnClass = 'vsm-third-container';
                    }
                    if (menu.Key == 'make' && menuOptions.length > 10) {
                        if (options.MakeScreenColumns >= 2) columnClass = 'vsm-half-container';
                    }
                    groupList.className = 'vsm-group-list ' + columnClass;
                    groupWrap.appendChild(buildListHeader('Ungrouped'));
                    groupWrap.appendChild(groupList);

                    var subGroup = menuGroupedOptions['_ungrouped'];
                    for (var i = 0; i < subGroup.length; i++) {
                        var listItem = buildListItem(subGroup[i]);
                        if (typeof listItem !== 'undefined') {
                            listItem.setAttribute('data-optionkey', menuKey);
                            listItem.setAttribute('data-menutitle', menuTitle);
                            groupList.appendChild(listItem);
                        }
                    }
                }
            }
            else {
                var groupList = document.createElement('div'),
                columnClass = 'vsm-one-container';
                if (menu.Key == 'year' && menuOptions.length > 10) {
                    if (options.YearScreenColumns == 2) columnClass = 'vsm-half-container';
                    if (options.YearScreenColumns >= 3) columnClass = 'vsm-third-container';
                }
                if (menu.Key == 'make' && menuOptions.length > 10) {
                    if (options.MakeScreenColumns >= 2) columnClass = 'vsm-half-container';
                }
                groupList.className = 'vsm-group-list ' + columnClass;
                groupWrap.appendChild(groupList);

                for (var i = 0; i < menuOptions.length; i++) {
                    var listItem = buildListItem(menuOptions[i]);
                    if (typeof listItem !== 'undefined') {
                        listItem.setAttribute('data-optionkey', menuKey);
                        listItem.setAttribute('data-menutitle', menuTitle);
                        groupList.appendChild(listItem);
                    }
                }
            }
        }
    }

    /**
     * Modal preparation: Show final vehicle selection
     * @private
     * @param  {Element} modal - The modal to prepare
     * @param  {Object} bestConfiguration - bestConfiguration object to pass in for modal content update
     * @return void
     */
    function showSelection(modal, bestConfiguration) {
        var vehicleImage = modal.querySelectorAll('.vsm-vehicle-display')[0],
        vehicleLoader = modal.querySelectorAll('.vsm-final .vsm-loaderIcon')[0],
        nameElement = modal.querySelectorAll('.vehicle-result-name')[0],
        sizeElement = modal.querySelectorAll('.vehicle-result-size')[0],
        confirmButton = modal.querySelectorAll('.vsm-find')[0],
        bodyElement = modal.querySelectorAll('.vsm-modal-body')[0],
        inProgressScreen = modal.querySelectorAll('.vsm-in-progress')[0];

        addClass(bodyElement, 'vsm-has-back');
        confirmButton.innerHTML = options.ConfirmButtonText;

        var infoBaseArray = [], infoBaseObj = {};

        for (var i = 0; i < infoArray.length; i++) {
          var splittedArray = infoArray[i].split(':');
          if (splittedArray.length == 2 && splittedArray[0] != 'Tire Size') {
              infoBaseArray.push(splittedArray[1]);
              infoBaseObj[splittedArray[0]] = splittedArray[1];
          }
        }

        var mainPartString = infoBaseArray[0],
        lastItem = infoBaseArray.pop();

        for (var i = 1; i < infoBaseArray.length; i++) {
            if (i >= 3) break;
            mainPartString += ' ' + infoBaseArray[i];
        }

        var vehicleDesc = mainPartString + ' ' + lastItem;

        nameElement.innerHTML = vehicleDesc;

        addClass(modal.querySelectorAll('.vsm-modal-body')[0], 'vsm-final-screen');
        inProgressScreen.parentNode.removeChild(inProgressScreen);

        var imageSettings = {
            Width: 260,
            Height: 120,
            PositionX: 1,
            PositionY: 1
        };

        if (options.ImageSettings) {
            extend(imageSettings, 
                   typeof options.ImageSettings === "function" ?
                        options.ImageSettings.call(this, options) :
                        options.ImageSettings);
        }

        imageSettings.VehicleConfiguration = bestConfiguration.Value;

        var imageUrl = ridestyler.ajax.url("Vehicle/Render", imageSettings);

        vehicleImage.src = imageUrl;
        vehicleImage.style.display = 'inline-block';
        vehicleImage.onload = function(){
            vehicleLoader.style.display = 'none';
        }

        var confirmHandler = function (e) {
            e.target.removeEventListener(e.type, confirmHandler);
            //Hide modal
            var allModals = document.querySelectorAll('.vsm-modal:not(#vsm_modal_base)'),
            parentBase = getClosest(this, '.vsm-modal');

            var copyOfDataArray = dataArray.slice(0);

            infoArray = [];
            dataArray = [];

            parentBase.style.opacity = 0;
            parentBase.onTransitionEndOnce(function(){
                [].forEach.call(allModals, function (thisModal) {thisModal.parentNode.removeChild(thisModal);});

                var vehicleInfo = {
                    ImageUrl: imageUrl,
                    VehicleDescription: vehicleDesc,
                    VehicleConfiguration: bestConfiguration.Value
                };

                extend(vehicleInfo, infoBaseObj);
                if (bestConfiguration.TireOptionBasic) extend(vehicleInfo, bestConfiguration.TireOptionBasic);
                if (options.callback && typeof options.callback == 'function') {
                    var outObj = {
                        FinalSelectionMade: true,
                        Vehicle: vehicleInfo,
                        FullSelectionData: copyOfDataArray
                    }
                    options.callback(outObj);
                }
                else {
                    hideModals();
                    console.warn('No callback function provided.');
                }
            });
            hideBackdrop();
        }

        confirmButton.addEventListener('click', confirmHandler, false);
    }

    this.Show = function () {
        loadBase();
        //Check for any existing modals
        var allModals = document.querySelectorAll('.vsm-modal:not(#vsm_modal_base)');
        if (allModals.length) {
            console.warn('There is currently another vsm instance running.');
            return;
        }
        var modal = base();
        createBackdrop();
        modal.style.display = 'block';
        disCountinued = false;
        setTimeout(function(){
            addClass(modal, 'in');
            addClass(document.body, 'vsm-modal-open');
            modal.onTransitionEndOnce(function(){
                requestStep(modal);
            })
        }, 50);
    }

    this.Hide = hideModals;
}