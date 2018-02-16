/**
 * External dependencies
 */
import { noop } from 'lodash';
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Component, compose } from '@wordpress/element';
import { Placeholder, Spinner } from '@wordpress/components';
import { query } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockEdit from '../../block-edit';
import ReusableBlockEditPanel from './edit-panel';

class ReusableBlockEdit extends Component {
	constructor() {
		super( ...arguments );

		this.startEditing = this.startEditing.bind( this );
		this.stopEditing = this.stopEditing.bind( this );
		this.setAttributes = this.setAttributes.bind( this );
		this.setTitle = this.setTitle.bind( this );
		this.save = this.save.bind( this );

		this.state = {
			isEditing: false,
			title: null,
		};
	}

	componentDidMount() {
		if ( ! this.props.reusableBlock ) {
			this.props.fetchReusableBlock();
		}
	}

	startEditing() {
		const { reusableBlock } = this.props;

		this.setState( {
			isEditing: true,
			title: reusableBlock.title,
		} );
	}

	stopEditing() {
		this.setState( {
			isEditing: false,
			title: null,
		} );
	}

	setAttributes( attributes ) {
		const { updateAttributes, block } = this.props;
		updateAttributes( block.uid, attributes );
	}

	setTitle( title ) {
		this.setState( { title } );
	}

	save() {
		const { reusableBlock, onUpdateTitle, onSave } = this.props;

		const { title } = this.state;
		if ( title !== reusableBlock.title ) {
			onUpdateTitle( title );
		}

		onSave();

		this.stopEditing();
	}

	render() {
		const { isSelected, reusableBlock, block, isFetching, isSaving } = this.props;
		const { isEditing, title } = this.state;

		if ( ! reusableBlock && isFetching ) {
			return <Placeholder><Spinner /></Placeholder>;
		}

		if ( ! reusableBlock || ! block ) {
			return <Placeholder>{ __( 'Block has been deleted or is unavailable.' ) }</Placeholder>;
		}

		return [
			// We fake the block being read-only by wrapping it with an element that has pointer-events: none
			<div key="edit" style={ { pointerEvents: isEditing ? 'auto' : 'none' } }>
				<BlockEdit
					{ ...this.props }
					isSelected={ isEditing && isSelected }
					id={ block.uid }
					name={ block.name }
					attributes={ block.attributes }
					setAttributes={ isEditing ? this.setAttributes : noop }
				/>
			</div>,
			( isSelected || isEditing ) && (
				<ReusableBlockEditPanel
					key="panel"
					isEditing={ isEditing }
					title={ title !== null ? title : reusableBlock.title }
					isSaving={ isSaving && ! reusableBlock.isTemporary }
					onEdit={ this.startEditing }
					onChangeTitle={ this.setTitle }
					onSave={ this.save }
					onCancel={ this.stopEditing }
				/>
			),
		];
	}
}

const applyConnect = connect(
	( state, ownProps ) => ( {
		reusableBlock: state.reusableBlocks.data[ ownProps.attributes.ref ],
		isFetching: state.reusableBlocks.isFetching[ ownProps.attributes.ref ],
		isSaving: state.reusableBlocks.isSaving[ ownProps.attributes.ref ],
	} ),
	( dispatch, ownProps ) => ( {
		fetchReusableBlock() {
			dispatch( {
				type: 'FETCH_REUSABLE_BLOCKS',
				id: ownProps.attributes.ref,
			} );
		},
		onUpdateTitle( title ) {
			dispatch( {
				type: 'UPDATE_REUSABLE_BLOCK_TITLE',
				id: ownProps.attributes.ref,
				title,
			} );
		},
		updateAttributes( uid, attributes ) {
			dispatch( {
				type: 'UPDATE_BLOCK_ATTRIBUTES',
				uid,
				attributes,
			} );
		},
		onSave() {
			dispatch( {
				type: 'SAVE_REUSABLE_BLOCK',
				id: ownProps.attributes.ref,
			} );
		},
	} )
);

const applyQuery = query( ( select, ownProps ) => {
	const props = {};

	if ( ownProps.reusableBlock ) {
		props.block = select( 'core/editor' ).getBlock( ownProps.reusableBlock.uid );
	}

	return props;
} );

const EnhancedReusableBlockEdit = compose( [
	applyConnect,
	applyQuery,
] )( ReusableBlockEdit );

export const name = 'core/block';

export const settings = {
	title: __( 'Reusable Block' ),
	category: 'reusable-blocks',
	isPrivate: true,

	attributes: {
		ref: {
			type: 'number',
		},
	},

	supports: {
		customClassName: false,
		html: false,
	},

	edit: EnhancedReusableBlockEdit,
	save: () => null,
};
