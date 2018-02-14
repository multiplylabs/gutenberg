/**
 * External dependencies
 */
import { includes } from 'lodash';

/**
 * Default options for withHistory reducer enhancer. Refer to withHistory
 * documentation for options explanation.
 *
 * @see withHistory
 *
 * @type {Object}
 */
const DEFAULT_OPTIONS = {
	resetTypes: [],
	shouldReplacePresent: () => false,
};

/**
 * Reducer enhancer which transforms the result of the original reducer into an
 * object tracking its own history (past, present, future).
 *
 * @param {Function}  reducer                      Original reducer.
 * @param {?Object}   options                      Optional options.
 * @param {?Array}    options.resetTypes           Action types upon which to
 *                                                 clear past.
 * @param {?Function} options.shouldReplacePresent Function receiving last and
 *                                                 current actions, returning
 *                                                 boolean indicating whether
 *                                                 present should be merged,
 *                                                 rather than add undo level.
 *
 * @return {Function} Enhanced reducer.
 */
export default function withHistory( reducer, options ) {
	options = { ...DEFAULT_OPTIONS, ...options };
	const { resetTypes, shouldReplacePresent } = options;

	const initialState = {
		past: [],
		present: reducer( undefined, {} ),
		future: [],
	};

	let lastAction;

	return ( state = initialState, action ) => {
		const { past, present, future } = state;

		const previousAction = lastAction;
		lastAction = action;

		switch ( action.type ) {
			case 'UNDO':
				// Can't undo if no past.
				if ( ! past.length ) {
					break;
				}

				return {
					past: past.slice( 0, past.length - 1 ),
					present: past[ past.length - 1 ],
					future: [ present, ...future ],
				};

			case 'REDO':
				// Can't redo if no future
				if ( ! future.length ) {
					break;
				}

				return {
					past: [ ...past, present ],
					present: future[ 0 ],
					future: future.slice( 1 ),
				};

			case 'CREATE_UNDO_LEVEL':
				return {
					past: [ ...past, present ],
					present,
					future: [],
				};
		}

		const nextPresent = reducer( present, action );

		if ( includes( resetTypes, action.type ) ) {
			return {
				past: [],
				present: nextPresent,
				future: [],
			};
		}

		if ( present === nextPresent ) {
			return state;
		}

		let nextPast = past;
		if ( ! shouldReplacePresent( action, previousAction ) ) {
			nextPast = [ ...nextPast, present ];
		}

		return {
			past: nextPast,
			present: nextPresent,
			future: [],
		};
	};
}
