/*******************************************************************************
Copyright © 2021 Ennio Marke
*******************************************************************************/

document.addEventListener("DOMContentLoaded", () => {

  //#region darkmode
  const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
  const currentTheme = localStorage.getItem('theme') ? localStorage.getItem('theme') : null;

  if (currentTheme) {
    document.documentElement.setAttribute('data-theme', currentTheme);

    if (currentTheme == 'dark') {
        toggleSwitch.checked = true;
    }
  }

  function switchTheme(e) {
    if (e.target.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark'); //add this
    }
    else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light'); //add this
    }
  }



  toggleSwitch.addEventListener('change', switchTheme, false);
  //#endregion

  //#region elements
  var output = document.getElementById("output")
  var input = document.getElementById("input")
  var slider = document.getElementById("speedSlider")
  var isNum = data => /^\d+$/.test(data);
  var lastMsg;
  var msg;
  var curMai = 1;
  //#endregion

  function load() {
    var readSpeed;
    while(!readSpeed) {
      readSpeed = prompt("Readspeed multiplier? (1-5)")
      if(readSpeed>5||readSpeed<1||!isNum(readSpeed)) readSpeed = 0
      readSpeed = parseInt(readSpeed)
    }

    while(!lastMsg) {
      lastMsg = prompt("Message to start with?")
    }
    logOutput(lastMsg, 0)

    var forever = setInterval(() => {
      setTimeout(() => {
        reqAndLog()
      }, 5000 / readSpeed );
    }, 5000 / readSpeed)
    
  }

  function reqAndLog() {
    $.get(`/api/mai?uid=mai&msg=${encodeURIComponent(lastMsg.cnt)}`, data => {
      msg = data  
      logOutput(msg.cnt, curMai)
      lastMsg = msg
      curMai = !curMai
    })
  }

  //output.scrollTop = output.scrollHeight;


  //#region functions

    function logOutput(text, cN) {
      var ul = document.getElementById("output");
      var li = document.createElement("li");
      li.appendChild(document.createTextNode(text));
      cN?li.classList.add("pink"):""
      ul.appendChild(li);
      output.scrollTop = output.scrollHeight;
    }
  //#endregion

    load()

})
