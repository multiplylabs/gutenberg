/**
 * WordPress dependencies
 */
import {
	BlockList,
	CopyHandler,
	PostTitle,
	WritingFlow,
	EditorGlobalKeyboardShortcuts,
	BlockSelectionClearer,
	MultiSelectScrollIntoView,
} from '@wordpress/editor';
import { Fragment } from '@wordpress/element';
import { query } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';
import BlockInspectorButton from './block-inspector-button';

function VisualEditor( { hasFixedToolbar } ) {
	return (
		<BlockSelectionClearer className="edit-post-visual-editor">
			<EditorGlobalKeyboardShortcuts />
			<CopyHandler />
			<MultiSelectScrollIntoView />
			<WritingFlow>
				<PostTitle />
				<BlockList
					showContextualToolbar={ ! hasFixedToolbar }
					renderBlockMenu={ ( { children, onClose } ) => (
						<Fragment>
							<BlockInspectorButton onClick={ onClose } />
							{ children }
						</Fragment>
					) }
				/>
			</WritingFlow>
		</BlockSelectionClearer>
	);
}

export default query( ( select ) => {
	return {
		hasFixedToolbar: select( 'core/edit-post' ).hasFixedToolbar(),
	};
} )( VisualEditor );
