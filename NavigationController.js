/* Navigation controller; on iOS uses NavigationGroup but on Android transitions manually */

var nav = {};

function NavigationController(options) {
	var $ = require('/' + Ti.App.DBVNo + '/lib/util');
	nav.settings = $.extend({
		animation: Titanium.UI.iPhone.AnimationStyle.FLIP_FROM_LEFT
	}, options);
	
	nav.windowStack = [];
	
	// We have our own checks here, but if they've already been done by the app, use the cached values
	if (typeof Ti.App.isTablet !== 'undefined' && typeof Ti.App.iOS !== 'undefined' && typeof Ti.App.android !== 'undefined') {
		nav.isTablet = Ti.App.isTablet;
		nav.iOS = Ti.App.iOS;
		nav.android = Ti.App.android;	
	} else {
		var osname = Ti.Platform.osname,
			version = Ti.Platform.version,
			height = Ti.Platform.displayCaps.platformHeight,
			width = Ti.Platform.displayCaps.platformWidth;
		
		var isTablet = osname === 'ipad' || (osname === 'android' && (width > 899 || height > 899));
			
		nav.isTablet = isTablet;
		nav.iOS = osname === 'ipad' || osname === 'iphone';
		nav.android = osname === 'android';
	}
	
};

NavigationController.prototype.open = function(/*Ti.UI.Window*/windowToOpen) {
	//add the window to the stack of windows managed by the controller
	nav.windowStack.push(windowToOpen);
	
	Ti.API.info('Ti.App.Nav.open() called! windows:' + nav.windowStack.length);

	// Grab a copy of the current nav controller for use in the callback

	windowToOpen.addEventListener('close', function() {
		Ti.API.info('closed window, checking whether it is still on the stack');
		
		if (nav.windowStack.length) {
			var lastWindow = nav.windowStack[nav.windowStack.length-1];
			if (lastWindow == windowToOpen) {
				// Popping off
				nav.windowStack.pop();
			}
		}
	});

	// Hack - setting nav.property ensures the window is "heavyweight" (associated with an Android activity)
	windowToOpen.navBarHidden = windowToOpen.navBarHidden || false;

	if (nav.windowStack.length === 1) {
		// nav.is the first window
		
		if (nav.android) {
			windowToOpen.exitOnClose = true;
			windowToOpen.open();
		} else if (nav.iOS) {
			nav.navGroup = Ti.UI.iOS.createNavigationWindow({
				window : windowToOpen
			});
			
			nav.navGroup.open({
				animation: Titanium.UI.iPhone.AnimationStyle.FLIP_FROM_LEFT
			});
		} else {
			alert('Requires Android or iOS');
		}
	} else {
		// All subsequent windows		
		if (nav.android) {
			windowToOpen.open();
		} else if (nav.iOS) {
			nav.navGroup.openWindow(windowToOpen);
		} else {
			alert('Requires Android or iOS');
		}
	}
};

NavigationController.prototype.back = function() {
	
	Ti.API.info('Ti.App.Nav.back() called - windows:' + nav.windowStack.length);
	
	var lastWindow = nav.windowStack.pop();
	
	if (nav.navGroup) {
		nav.navGroup.closeWindow(lastWindow);
	} else {
		lastWindow.hide();
		lastWindow.close();
		lastWindow = null;
	}
};

// Go back to the initial window of the NavigationController
NavigationController.prototype.home = function() {
	// Store a copy of all the current windows on the stack
	var windows = nav.windowStack.concat([]);
	//for(var i = 1, l = windows.length; i < l; i++) {Cont
	for(var i = 1, l = windows.length; i < l; i++) {
		if (nav.navGroup) {
			nav.navGroup.closeWindow(windows[i]);
		} else {
			windows[i].close();
		}
	}
	nav.windowStack = [nav.windowStack[0]]; // reset stack
};

module.exports = NavigationController;