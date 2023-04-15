let colors = ["#f94144","#f3722c","#f8961e","#f9844a","#90be6d","#43aa8b","#4d908e","#577590","#277da1","#FF5733"];

var i = 0;

(function () {
	setModeEventListener();
	setRandomLinkColor();
	setColorHoverListener();
	setInterval(() => {
		setRandomLinkColor();
		setPic();
	}, 7000);
})();

/* Dark Mode */

function setModeEventListener() {
	let list = document.body.classList;
	document.getElementById("toggler").addEventListener("change", (event) => {
        if (event.target.checked){
            list.add("dark-mode");
            colors = ["#ffadad", "#fbf8cc","#fde4cf","#ffcfd2","#f1c0e8","#cfbaf0","#a3c4f3","#90dbf4","#8eecf5","#98f5e1","#b9fbc0"]
            setRandomLinkColor();
        }
        else{
            list.remove("dark-mode");
            colors = colors = ["#f94144","#f3722c","#f8961e","#f9844a","#90be6d","#43aa8b","#4d908e","#577590","#277da1", "#FF5733"];
            setRandomLinkColor();
        }
	});
}

/* Colors */

function getRandomColor() {
	return colors[Math.floor(Math.random() * colors.length)];
}

function setRandomLinkColor() {
	Array.from(document.getElementsByTagName("a")).forEach((e) => {
		e.style.color = getRandomColor();
	});
}

function setColorHoverListener() {
	Array.from(document.querySelectorAll("a, button")).forEach((e) => {
		e.addEventListener("mouseover", setRandomLinkColor);
	});
}

/* Generate next photo */
function setPic() {
	if (i == 4){	// change if more pics; if on me_1, make it 2 
		i = 0;
	}
	let genImage = "images/me_" + i + ".jpg";
	document.getElementById("mypic").src = genImage;
	i++;
}