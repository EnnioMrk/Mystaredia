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
  //#endregion

  $("textarea").each(function () {
    this.setAttribute("style", "height:" + (this.scrollHeight) + "px;overflow-y:hidden;");
  }).on("input", function () {
    this.style.height = "auto";
    this.style.height = (this.scrollHeight) + "px";
  });

  function logOutput(text) {
    var ul = document.getElementById("output");
    var li = document.createElement("li");
    li.appendChild(document.createTextNode("Four"));
    ul.appendChild(li);
  }

  $("textarea").keydown(function(e){
    // Enter was pressed without shift key
    if (e.keyCode == 13 && !e.shiftKey)
    {
      // prevent default behavior
      e.preventDefault();
      if(input.value=="") return
      logOutput(input.value)
        $.ajax({
          url: `/api/mai?uid=${encodeURIComponent(userName)}&msg=${encodeURIComponent(input.value)}`,
          type: "GET",
          withCredentials: true,
          success: function (data) {
            logOutput(data.cnt, 1)
            output.scrollTop = output.scrollHeight;
          	console.log(data)
          },
          error: function (xhr, status) {
            alert("error");
          }
        });
        input.value = "";
        output.scrollTop = output.scrollHeight;
    }
  })

  //#region functions
    function logOutput(text, cN) {
      var ul = document.getElementById("output");
      var li = document.createElement("li");
      li.appendChild(document.createTextNode(text));
      cN?li.classList.add("pink"):""
      ul.appendChild(li);
    }
  //#endregion

  var userName = prompt("What is your name?")
  userName.toLowerCase() == "ennio"? 
  	prompt("psw?").toLowerCase() == "myst"? 
    	userName == "Mystical_Ennio":userName == "impersonate"
  :""
})