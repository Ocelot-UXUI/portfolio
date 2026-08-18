import React from 'react';
import {createRoot} from 'react-dom/client';

import {ApplicationDropdown} from '@cnap-application-dropdown';

const toneColors = {
    mint: '#72d7aa',
    blue: '#6a96ec',
    yellow: '#e7ba53',
    purple: '#a784e8',
};

function toOptionGroups(items) {
    const toOption = item => ({
        id: item.name,
        name: item.name,
        avatarText: item.initial,
        favorite: item.favorite,
        type: toneColors[item.tone] ?? '#a1e8ce',
    });
    const options = items.map(toOption);
    return {
        all: options,
        favorites: options.filter(option => option.favorite),
        recent: options.slice(0, 2),
    };
}

window.mountCnapApplicationDropdown = (mountNode, {items, onSelect, onAction}) => {
    const rootNode = document.createElement('div');
    rootNode.dataset.cnapReactRoot = 'application-dropdown';
    mountNode.replaceChildren(rootNode);
    mountNode.classList.add('application-menu-react');

    const reactRoot = createRoot(rootNode);
    reactRoot.render(
        <ApplicationDropdown
            optionGroups={toOptionGroups(items)}
            onSelect={onSelect}
        />,
    );

    rootNode.__cnapUnmount = () => reactRoot.unmount();
    rootNode.addEventListener('click', event => {
        const footerButton = event.target.closest('button[aria-label$="占位"]');
        if (footerButton) onAction?.(footerButton.textContent.trim());
    });
};

window.unmountCnapApplicationDropdown = mountNode => {
    const rootNode = mountNode.querySelector('[data-cnap-react-root]');
    rootNode?.__cnapUnmount?.();
    mountNode.classList.remove('application-menu-react');
};
