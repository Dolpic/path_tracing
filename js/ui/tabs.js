export default class Tabs{
    constructor(container, name, tabsTitles, selected=None){
        this.container = container
        this.name = name

        let tabs     = tabsTitles.map(e => `<div id="${this.tabId(e)}" class="${selected==e?"selectedTab":""}">${e}</div>` ).join("")
        let contents = tabsTitles.map(e => `<div id="${this.contentId(e)}" style="${selected==e?"display:inline-block":""}"></div>`).join("")

        container.innerHTML = `
            <div id="${this.tabsId()}"     class="tabs_titles">     ${tabs}     </div>
            <div id="${this.contentsId()}" class="tabs_contents"> ${contents} </div>
        `

        tabsTitles.forEach(title => document.getElementById(this.tabId(title)).onclick = this.getOnclickFunction(title))
    }

    tabsId(){         return this.name+"_tabs" }
    contentsId(){     return this.name+"_contents" }
    tabId(title){     return this.name+"_"+title+"_tab" }
    contentId(title){ return this.name+"_"+title+"_content" }

    setContent(title, content){
        document.getElementById(this.contentId(title)).innerHTML = content
    }

    getOnclickFunction(title){
        return () => {
            let tabsChildren     = Array.from(document.getElementById(this.tabsId()).children) 
            let contentsChildren = Array.from(document.getElementById(this.contentsId()).children) 
            tabsChildren.forEach(child => child.id === this.tabId(title) ? child.classList.add("selectedTab") : child.classList.remove("selectedTab"))
            contentsChildren.forEach(child => child.style.display = child.id == this.contentId(title) ? "inline-block" : "none")
        }
    }
}
let styleSheet = document.createElement("style")
styleSheet.innerText = `
    .tabs_titles{
        display: flex;
        flex-wrap: wrap;
        justify-content: space-around;
        align-items: center;
        border-bottom: 1px solid var(--dark);
        margin-bottom: 8px;
    }
    .tabs_titles > div{
        padding:8px;
    }
    .tabs_titles .selectedTab{
        background-color: var(--dark);
    }
    .tabs_contents > div{
        display:none;
        padding: 0px 12px 0px 12px;
        width: 92%;
    }
`.replaceAll("\n", "")
document.head.appendChild(styleSheet)