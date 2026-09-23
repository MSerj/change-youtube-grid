// ==UserScript==
// @name		    YouTube Tweeks by MSerj
// @icon            https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @version		    2.0.0
// @description     A configurable collection of YouTube layout and feed enhancements.
// @match           *://www.youtube.com/*
// @match           *://m.youtube.com/*
// @run-at		    document-end

// @copyright     2025, MSerj
// @license       MIT
// @namespace     https://greasyfork.org/en/users/1321619-mserj

// @grant               GM_registerMenuCommand
// @grant               GM_unregisterMenuCommand
// @grant               GM_getValue
// @grant               GM_setValue
// @grant               GM_addStyle
// ==/UserScript==

/* jshint esversion: 11 */

;(() => {
	'use strict'

	const CONFIG = {
		columns: 'ytd-items-per-row',
		features: {
			grid: 'yt-tweeks-grid',
			shorts: 'yt-tweeks-shorts',
			mix: 'yt-tweeks-mix',
			watched: 'yt-tweeks-watched'
		}
	}

	const selectors = {
		shorts: [
			'ytm-pivot-bar-item-renderer:has(.pivot-shorts)',
			'ytd-mini-guide-entry-renderer:has(a#endpoint[title*="shorts" i])',
			'ytd-guide-entry-renderer:has(a#endpoint[title*="shorts" i])',
			'yt-chip-cloud-chip-renderer:has(yt-formatted-string[title*="shorts" i])',
			'yt-tab-shape[tab-title*="shorts" i]',
			'ytm-reel-shelf-renderer',
			'ytd-reel-shelf-renderer',
			'ytm-item-section-renderer:has(.big-shorts-singleton)',
			'ytd-rich-section-renderer:has(ytd-rich-shelf-renderer)',
			'ytd-video-renderer:has(a#thumbnail[href*="shorts" i])',
			'ytd-rich-item-renderer:has(ytd-ad-slot-renderer)'
		],
		mix: [
			'yt-chip-cloud-chip-renderer:has(yt-formatted-string[title*=mixes i])',
			'ytd-rich-item-renderer:has(ytd-playlist-thumbnail):has(a[title^="Mix - "])',
			'ytd-rich-item-renderer:has(ytd-playlist-thumbnail):has(a[title="My Mix"])',
			'ytd-rich-item-renderer:has(yt-collections-stack):has([title^="Mix - "])',
			'ytd-rich-item-renderer:has(yt-collections-stack):has([title="My Mix"])',
			'ytd-radio-renderer:has(ytd-playlist-thumbnail):has(span[title^="Mix - "])',
			'ytd-compact-radio-renderer:has(yt-collections-stack):has(span[title^="Mix - "])'
		],
		watched: ['ytd-rich-item-renderer:has(#progress[style="width: 100%;"])', 'ytd-compact-video-renderer:has(#progress[style="width: 100%;"])']
	}

	const clampColumns = value => Math.min(10, Math.max(1, parseInt(value) || 5))
	const state = {
		columns: clampColumns(localStorage.getItem(CONFIG.columns))
	}
	const options = [
		{ id: 'shorts', title: 'Hide Shorts', defaultValue: true, selectors: selectors.shorts },
		{ id: 'mix', title: 'Hide Mixes', defaultValue: false, selectors: selectors.mix },
		{ id: 'watched', title: 'Hide watched videos', defaultValue: false, selectors: selectors.watched },
		{ id: 'grid', title: 'Grid adjustment', defaultValue: true }
	]
	const style = document.createElement('style')
	document.head.appendChild(style)

	const useOption = option => {
		const ref = {
			get value() {
				return GM_getValue(option.id, option.defaultValue)
			},
			set value(value) {
				GM_setValue(option.id, value)
			}
		}
		return { ...option, ref }
	}
	const usedOptions = options.map(useOption)
	const menuEntries = [
		// { id: 'feed-section', title: '--- Feed filters ---', type: 'section' },
		...usedOptions.slice(0, 3),
		// { id: 'grid-section', title: '--- Grid adjustments ---', type: 'section' },
		usedOptions[3],
		{ id: 'grid-columns', title: '🖥️ Set grid columns', type: 'columns' }
	]
	const register = entry => {
		if (entry.type === 'section') {
			GM_registerMenuCommand(entry.title, () => {}, { id: entry.id, autoClose: false })
			return
		}
		if (entry.type === 'columns') {
			GM_registerMenuCommand(
				entry.title,
				() => {
					const input = prompt('Please enter the number of videos displayed per line (1-10):', state.columns)
					if (input === null) return
					state.columns = clampColumns(input)
					localStorage.setItem(CONFIG.columns, state.columns)
					update()
					alert(`Current settings: ${state.columns} videos are displayed per line`)
				},
				{ id: entry.id, autoClose: false }
			)
			return
		}
		const { id, ref, title } = entry
		GM_registerMenuCommand(
			`${ref.value ? '✅' : '❌'} ${title}`,
			() => {
				ref.value = !ref.value
				setTimeout(update)
			},
			{ id, autoClose: false }
		)
	}
	const unregister = entry => {
		GM_unregisterMenuCommand(entry.id)
	}
	const update = () => {
		menuEntries.forEach(unregister)
		menuEntries.forEach(register)
		const rules = []
		if (usedOptions[3].ref.value) {
			rules.push(`
				.style-scope.ytd-two-column-browse-results-renderer {
					--ytd-rich-grid-items-per-row: ${state.columns} !important;
					--ytd-rich-grid-gutter-margin: 0px !important;
				}`)
		}
		usedOptions
			.filter(option => option.ref.value && option.selectors)
			.forEach(option => {
				rules.push(`${option.selectors.join(',')}{ display: none !important; }`)
			})
		style.textContent = rules.join('\n')
	}

	update()
})()
