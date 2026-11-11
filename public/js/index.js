/*******************************************************************************
Copyright © 2021 Ennio Marke
 ____    ____  ____  ____   ______   _________  
|_   \  /   _||_  _||_  _|.' ____ \ |  _   _  | 
  |   \/   |    \ \  / /  | (___ \_||_/ | | \_| 
  | |\  /| |     \ \/ /    _.____`.     | |     
 _| |_\/_| |_    _|  |_   | \____) |   _| |_    
|_____||_____|  |______|   \______.'  |_____| 
*******************************************************************************/

// Site list comes from the Worker now, not from PHP inline output.
const pagesReady = fetch("/api/pages")
        .then((response) => (response.ok ? response.json() : []))
        .then((list) => (window.Pages = list))
        .catch(() => (window.Pages = []));

document.addEventListener("DOMContentLoaded", async () => {
        await pagesReady;
        
        //console.log("Pages: \n" + JSON.stringify(Pages,null,2));

        //#region cheatcodes
        // a key map of allowed keys
        var allowedKeys = {
                37: 'left',
                38: 'up',
                39: 'right',
                40: 'down',
                65: 'a',
                66: 'b'
        };

        // the 'official' Konami Code sequence
        var konamiCode = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'];

        // a variable to remember the 'position' the user has reached so far.
        var konamiCodePosition = 0;
        //#endregion 

        //#region variables
        var inputField = document.getElementById("psw-input")
        var mystarediaLogo = document.getElementById("logo")
        //var Pages = getSitesJson()
        //console.log(Pages)
        //#endregion

        //#region hide mouse pointer
        function hideMousePointer() {
                var mouseTimer = null, cursorVisible = true;
            
                function disappearCursor() {
                    mouseTimer = null;
                    document.body.style.cursor = "none";
                    cursorVisible = false;
                }
                
                document.onmousemove = function() {
                    if (mouseTimer) {
                        window.clearTimeout(mouseTimer);
                    }
                    if (!cursorVisible) {
                        document.body.style.cursor = "default";
                        cursorVisible = true;
                    }
                    mouseTimer = window.setTimeout(disappearCursor, 2000);
                };
            }
        //#endregion

        //#region functions

        //#region lerp functions
        const lerp = (x, y, a) => x * (1 - a) + y * a;
        const clamp = (a, min = 0, max = 1) => Math.min(max, Math.max(min, a));
        const invlerp = (x, y, a) => clamp((a - x) / (y - x));
        const range = (x1, y1, x2, y2, a) => lerp(x2, y2, invlerp(x1, y1, a));
        //#endregion

        //#region tools
    	function sFSite(q) {
          	qR = Pages.filter((pages)=>{return pages.psw == q})
          	if(JSON.stringify(qR) != "[]") {
            	return qR[0].href
            } else {
            	return 0
            }
        }
  
        function searchPageObj(toFind) {
                return Object.values(Pages).find((obj) => {
                        return obj.psw == toFind
                });
        }

        function readTextFile(file, callback) {
                var rawFile = new XMLHttpRequest();
                rawFile.overrideMimeType("application/json");
                rawFile.open("GET", file, true);
                rawFile.onreadystatechange = function() {
                    if (rawFile.readyState === 4 && rawFile.status == "200") {
                        callback(rawFile.responseText);
                    }
                }
                rawFile.send(null);
        }
        
        function getSitesJson() {
                 return readTextFile("../sites/sites.json", function(text){
                        var data = JSON.parse(text);
                        return data;
                })
        }
        //#endregion

        function control(e) {
                if (e.keyCode == 13) {
                        checkInput();
                        inputField.value = "";
                }
                // get the value of the key code from the key map
                var key = allowedKeys[e.keyCode];
                // get the value of the required key from the konami code
                var requiredKey = konamiCode[konamiCodePosition];
        
                // compare the key with the required key
                if (key == requiredKey) {

                        // move to the next key in the konami code sequence
                        konamiCodePosition++;

                        // if the last key is reached, activate cheats
                        if (konamiCodePosition == konamiCode.length) {
                                changePage("konami");
                                konamiCodePosition = 0;
                        }
                } else {
                        konamiCodePosition = 0;
                }
        }

        function checkInput() {
                var input = inputField.value
                var sHref = sFSite(input)
                if(sHref != 0){
                        changePage(sHref)
                }
        }

        function changePage(input) {
                mystarediaLogo.classList.add("fade-out");
                inputField.classList.add("fade-out");
                setTimeout(() => {
                        window.location.href = input
                }, 1000);   
        }
        //#endregion

        //#region event listeners

        document.addEventListener("keydown", control);

        //#endregion

})