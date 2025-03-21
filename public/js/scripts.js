


const logo = document.getElementById('navwheel')

const ghIcon = document.getElementById('gh')


const linkedInIcon = document.getElementById('li');
const emailIcon = document.getElementById('em');



// action functions


/*
function removeIcons(){

   
        ghIcon.classList.add('invisible');
        ghIcon.classList.remove('visible');
        linkedInIcon.classList.add('invisible')
        linkedInIcon.classList.remove('visible')
        emailIcon.classList.add('invisible')
        emailIcon.classList.remove('visible')
        
    }
    */
    
function addIcons(){
    
        ghIcon.classList.add("visible");
        ghIcon.classList.remove("invisible");
        linkedInIcon.classList.add("visible")
        linkedInIcon.classList.remove("invisible")
        emailIcon.classList.add("visible")
        emailIcon.classList.remove("invisible")
   
        
    }

//Event Listeners

logo.addEventListener('mouseenter', (event)=>{

//event.target.alert('test')
//logo.style.border = "5px dotted orange"
logo.classList.add("change")
logo.classList.remove("changeback")
addIcons();



})


logo.addEventListener('mouseleave',(event)=>{


logo.style.border="none"
logo.classList.add("changeback")
//logo.style.cssFloat="none"
logo.classList.remove("change")

//removeIcons();

}


);

linkedInIcon.addEventListener('mousenter', (event)=>{

    linkedInIcon.classList.add("visible")
linkedInIcon.border="5px solid"

})





