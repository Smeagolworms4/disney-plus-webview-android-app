const startingIndexes = {
    "/home": '[data-set-style="brand"] a', // Exemple: page spécifique avec un index de départ à 3
    "/browse/": '[data-testid="details-featured-actions"] a',
    // Ajoute d'autres URLs avec l'index souhaité ici
};


// Fonction pour récupérer tous les éléments focusables, y compris avec role et tabindex
function getFocusableElements() {
    return Array.from(document.querySelectorAll(`
        a[href],
        button,
        input:not([type="hidden"]),
        select,
        textarea,
        [tabindex]:not([tabindex="-1"]),
        [role="button"],
        [role="link"],
        [role="checkbox"],
        [role="menuitem"],
        [role="option"],
        [role="radio"],
        [role="switch"],
        [role="tab"]
    `))
    .filter(el => !el.hasAttribute('disabled'))
    //.filter(el => !el.hasAttribute('disabled') && el.tabIndex >= 0)
    .filter(el => {
        const box = el.getBoundingClientRect();
        return box.width !== 0 && box.height !== 0;
    });
}

function isInHeader(element) {
	const header = document.querySelector('header');
	return header.contains(element);
}

const alignMarge = 5;
function getAlignR(element) {
	const box = element.getBoundingClientRect();
	return getFocusableElements()
		.filter(target => {
			const box2 = target.getBoundingClientRect();
			return box.x < box2.x && box.y < (box2.y + alignMarge) && box.y > (box2.y - alignMarge) && (box2.left - box.right) < 100 && isInHeader(element) === isInHeader(target);
		})
		.sort((a, b) => a.getBoundingClientRect().x - b.getBoundingClientRect().x)
	[0] ?? null;
}
function getAlignL(element) {
	const box = element.getBoundingClientRect();
	return getFocusableElements()
		.filter(target => {
			const box2 = target.getBoundingClientRect();
			return box.x > box2.x && box.y < (box2.y + alignMarge) && box.y > (box2.y - alignMarge) && (box.left - box2.right) < 100 && isInHeader(element) === isInHeader(target);
		})
		.sort((a, b) => b.getBoundingClientRect().x - a.getBoundingClientRect().x)
	[0] ?? null;
}
function getAlignD(element) {
	const box = element.getBoundingClientRect();
	return getFocusableElements()
		.filter(target => {
			const box2 = target.getBoundingClientRect();
			return box.y < box2.y && box.x < (box2.x + alignMarge) && box.x > (box2.x - alignMarge) && (box2.top - box.bottom) < 100;
		})
		.sort((a, b) => a.getBoundingClientRect().y - b.getBoundingClientRect().y)
	[0] ?? null;
}
function getAlignU(element, ignoreHeader) {
	const box = element.getBoundingClientRect();
	return getFocusableElements()
		.filter(target => {
			const box2 = target.getBoundingClientRect();
			return box.y > box2.y && box.x < (box2.x + alignMarge) && box.x > (box2.x - alignMarge) && (box.top - box2.bottom) < 100 && (!ignoreHeader || !isInHeader(target));
		})
		.sort((a, b) => b.getBoundingClientRect().y - a.getBoundingClientRect().y)
	[0] ?? null;
}


function getAlmostD(element) {
	const box = element.getBoundingClientRect();
	return getFocusableElements()
		.filter(target => {
			const box2 = target.getBoundingClientRect();
			return box.y < box2.y && target.tabIndex >= 0;
		})
		.sort((a, b) => getDistance(element, a) - getDistance(element, b))
	[0] ?? null;
}
function getAlmostU(element, ignoreHeader) {
	const box = element.getBoundingClientRect();
	return getFocusableElements()
		.filter(target => {
			const box2 = target.getBoundingClientRect();
			return box.y > box2.y && target.tabIndex >= 0 && (!ignoreHeader || !isInHeader(target));
		})
		.sort((a, b) => getDistance(element, a) - getDistance(element, b))
	[0] ?? null;
}
function getAlmostR(element) {
	const box = element.getBoundingClientRect();
	return getFocusableElements()
		.filter(target => {
			const box2 = target.getBoundingClientRect();
			return box.x < box2.x && target.tabIndex >= 0 && isInHeader(element) === isInHeader(target);
		})
		.sort((a, b) => getDistance(element, a) - getDistance(element, b))
	[0] ?? null;
}
function getAlmostL(element) {
	const box = element.getBoundingClientRect();
	return getFocusableElements()
		.filter(target => {
			const box2 = target.getBoundingClientRect();
			return box.x > box2.x && target.tabIndex >= 0 && isInHeader(element) === isInHeader(target);
		})
		.sort((a, b) => getDistance(element, a) - getDistance(element, b))
	[0] ?? null;
}

// Fonction pour calculer la distance vectorielle entre deux éléments
function getDistance(element, target) {
    const elemRect = element.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    const dx = targetRect.left - elemRect.left;
    const dy = targetRect.top - elemRect.top;
    
    return Math.sqrt(dx * dx + dy * dy);
}

function getFocusableElementInDirection(element, direction) {

	let target = null;
	// Search align element
    switch (direction) {
        case 'ArrowDown':
			target = getAlignD(element);
			break;
			
        case 'ArrowUp':
			target = getAlignU(element, true);
			break;
			
        case 'ArrowRight':
			target = getAlignR(element);
			break;
			
        case 'ArrowLeft':
			target = getAlignL(element);
			break;
    }
    if (!target) {
		switch (direction) {
		    case 'ArrowDown':
				target = getAlmostD(element);
				break;
				
		    case 'ArrowUp':
				target = getAlmostU(element, true);
				if (!target) {
					window.scrollTo({
						top: 0,
						behavior: "smooth"
					});
					target = getAlmostU(element);
				}
				break;
				
		    case 'ArrowRight':
				target = getAlmostR(element);
				break;
				
		    case 'ArrowLeft':
				target = getAlmostL(element);
				break;
		}
	}
    
	return target;
}

function navigateFocusableElements(direction) {
	console.log('KEY', direction);
	const start = document.activeElement;
	let currentElement = document.activeElement;
	const list = getFocusableElements();

	
	// Si aucun élément n'est focusé, commence à l'index défini pour l'URL ou au début
    if (!currentElement || currentElement === document.body) {
	    const url = window.location.hostname + window.location.pathname;
		const key = Object.keys(startingIndexes).find(path => url.indexOf(path) !== -1);
		const index = key ? (startingIndexes[key] ?? 0) : 0
		let target;
		if (typeof index === 'string') {
		    target = document.querySelector(index) || list[0];
		} else {
            target = list[index] || list[0];
        }
        if (target) {
		    target.focus();
		    scrollToView(target);
        }
        return;
    }
	
	const focusNext = () => {
		// Trouver l'élément le plus proche dans la direction spécifiée
		const nextElement = getFocusableElementInDirection(currentElement, direction);

		// Si un élément est trouvé, appliquer le focus et le scroll
		if (nextElement) {
		    nextElement.focus();
		    scrollToView(nextElement);
		    setTimeout(() => {
		    	if (document.activeElement === start) {
		    		currentElement = nextElement;
					focusNext();
		    		
		    	}
		    }, 100);
		}
	};
	focusNext();
}


function handleKey(event) {

    const url = window.location.hostname + window.location.pathname;
    if (url.indexOf('/play/') !== -1) {
    	return;
    }
	    
	if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.stopImmediatePropagation();
		event.stopPropagation();
		event.preventDefault();
        navigateFocusableElements(event.key);
    }
}

const targetNode = document.body;

function applyFocusable() {
    const list = getFocusableElements();
	list.forEach(el => {
		if (!el.__cutom_handle_key__) {
			el.__cutom_handle_key__ = true;
			el.addEventListener('keydown', handleKey);
		}
	});
}

const observer = new MutationObserver((mutationsList, observer) => {
    const list = getFocusableElements();
	applyFocusable();
	
});

const config = {
    childList: true,        // Observer les changements dans la liste des enfants (ajout/suppression de nœuds)
    attributes: true,       // Observer les changements d'attributs
    subtree: true           // Observer les changements dans les sous-arbres
};


// Fonction pour scroll un élément jusqu'à ce qu'il soit visible


function scrollToView(el) {
    let currentElement = el;
    while (currentElement && currentElement !== document.body) {
        currentElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        if (isElementInViewport(currentElement, el)) {
            break;
        }
        currentElement = currentElement.parentElement;
    }
}



// Vérifie si un élément est visible dans la fenêtre
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

observer.observe(document.body, config);
document.body.addEventListener('keydown', handleKey);
applyFocusable();
