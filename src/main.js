(function init() {
    [FAV, DEL].forEach(type => {
        const item = new Action(type);
        ACTIONS[item.name] = item;
    })

    PARAMS.forEach(loadSection)
})()

async function loadSection(param) {
    let total = 0;

    createBase();

    let vacancies = await getVacancies();
    let groupedVacancies = groupVacancies(vacancies);

    createItems(groupedVacancies);

    document.querySelector(`#total-${param.id}`).innerText = total;

    function createBase() {
        const SECTION = document.createElement('section');

        const TITLE = document.createElement('h1');
        TITLE.innerHTML = `${param.name}: <span id="total-${param.id}">...</span>`

        SECTION.appendChild(TITLE);

        const WRAP = document.createElement('div');
        WRAP.setAttribute('id',`items-${param.id}`);
        WRAP.classList.add('items');

        SECTION.appendChild(WRAP);

        document.querySelector('main').appendChild(SECTION);
    }

    async function getVacancies() {
        let zeroStep = await vacanciesStep(0,'noExperience');
        let result = zeroStep.items.map(item => {
            item.no_exp = true;
            return item;
        });

        let firstStep = await vacanciesStep();
        result = [...result, ...firstStep.items];
        let pagesLeft = firstStep.pagesLeft;

        if(LOAD_ALL_DATA)
            while(--pagesLeft > 0) {
                const step = await vacanciesStep(pagesLeft);
                result.push(...step.items);
            }

        return result;
    }

    async function vacanciesStep(pageNum = 0, exp = 'between1And3') {
        let response = await fetch(`https://api.hh.ru/vacancies?text=frontend&${param.location}&per_page=${LOAD_ALL_DATA ? 100 : 5}&page=${pageNum}&experience=${exp}`);

        if (response.ok) {
            const json = await response.json();
            return {
                items: json.items,
                pagesLeft: json.pages
            };
        } else {
            return new Error("Ошибка HTTP: " + response.status);
        }
    }

    function groupVacancies(vacancies) {
        let result = {};

        vacancies.forEach(vacancy => {
            const EMPLOYER = vacancy.employer;
            const EMPLOYER_ID = EMPLOYER.id;

            if(!result.hasOwnProperty(EMPLOYER_ID)) {
                result[EMPLOYER_ID] = {
                    items: [],
                    name: EMPLOYER.name
                }
            }
            result[EMPLOYER_ID].items.push(vacancy)
        })

        return Object.values(result);
    }

    function createItems(vacancies) {
        const BODY = document.querySelector(`#items-${param.id}`);

        vacancies.forEach(vacanciesItem => {
            if(!COMPANY_BLACKLIST.includes(vacanciesItem.items[0].employer.id)) {
                const NODE = createItem(vacanciesItem);

                if(NODE)
                    BODY.appendChild(NODE)
            }
        })
    }

    function createItem(vacanciesItem) {

        let wrapNode = document.createElement('div');
        wrapNode.classList.add('item');
        wrapNode.setAttribute('data-c-blacklist',vacanciesItem.items[0].employer.id);
        const LOGO_URL = vacanciesItem.items[0].employer.logo_urls;

        wrapNode.innerHTML = `<h2>${vacanciesItem.name} <img src="${LOGO_URL ? LOGO_URL['90'] : ''}"></h2>`;
        let i = 0; /* TODO Счетчик валидных элементов */
        let prevVacancyName = ''; /* Проверка дублей вакансии */

        vacanciesItem.items.forEach(vacancy => {
            const IS_NEW = vacancy.name !== prevVacancyName;
            const IS_HIDDEN = ACTIONS[DEL.name].isContain(vacancy.id);
            const IS_VALID_NAME = vacancy.name.match(NECESSARY) && !vacancy.name.match(UNNECESSARY);

            if(IS_NEW && IS_VALID_NAME && !IS_HIDDEN) {
                const IS_NEW = new Date(vacancy.created_at) > VALID_NEW_DATE;
                const IS_JUN = vacancy['no_exp'] || vacancy.name.match(JUNIOR);

                prevVacancyName = vacancy.name;
                i++;

                if(IS_NEW)
                    wrapNode.classList.add('new');

                if(IS_JUN)
                    wrapNode.classList.add('no-exp');

                const ITEM_NODE = template(vacancy);

                wrapNode.appendChild(ITEM_NODE)
            }
        })

        total += i;

        return i > 0 ? wrapNode : false;
    }

    function template(vacancy) {

        const LINK = document.createElement('a');
        LINK.setAttribute('href',vacancy.alternate_url);
        LINK.setAttribute('target','_blank');
        LINK.className = 'link';


        const LINK_TEXT = document.createElement('span');
        LINK_TEXT.innerText = vacancy.name;
        LINK_TEXT.className = 'link__text';

        if(ACTIONS[FAV.name].isContain(vacancy.id))
            LINK_TEXT.classList.add('link__text--favorite');

        LINK.appendChild(LINK_TEXT)

        for(let action in ACTIONS) {
            LINK.appendChild(createIcon(ACTIONS[action], vacancy.id, LINK_TEXT))
        }

        return LINK
    }

    function createIcon(Action, id, LINK_TEXT) {
        const ICON = document.createElement('span');
        ICON.setAttribute(`data-${Action.name}`,'');
        ICON.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            if(!Action.isContain(id)) {
                LINK_TEXT.classList.add(`link__text--${Action.name}`);
                Action.addItem(id);
            } else {
                LINK_TEXT.classList.remove(`link__text--${Action.name}`);
                Action.removeItem(id);
            }
        });

        return ICON;
    }

}

