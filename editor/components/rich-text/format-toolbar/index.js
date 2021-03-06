/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import {
	Fill,
	IconButton,
	ToggleControl,
	Toolbar,
	withSpokenMessages,
} from '@wordpress/components';
import { keycodes } from '@wordpress/utils';
import { prependHTTP } from '@wordpress/url';

/**
 * Internal dependencies
 */
import './style.scss';
import UrlInput from '../../url-input';
import { filterURLForDisplay } from '../../../utils/url';

const { ESCAPE, LEFT, RIGHT, UP, DOWN, BACKSPACE, ENTER, displayShortcut } = keycodes;

const FORMATTING_CONTROLS = [
	{
		icon: 'editor-bold',
		title: __( 'Bold' ),
		shortcut: displayShortcut.primary( 'b' ),
		format: 'bold',
	},
	{
		icon: 'editor-italic',
		title: __( 'Italic' ),
		shortcut: displayShortcut.primary( 'i' ),
		format: 'italic',
	},
	{
		icon: 'editor-strikethrough',
		title: __( 'Strikethrough' ),
		shortcut: displayShortcut.access( 'd' ),
		format: 'strikethrough',
	},
	{
		icon: 'admin-links',
		title: __( 'Link' ),
		shortcut: displayShortcut.primary( 'k' ),
		format: 'link',
	},
];

// Default controls shown if no `enabledControls` prop provided
const DEFAULT_CONTROLS = [ 'bold', 'italic', 'strikethrough', 'link' ];

// Stop the key event from propagating up to maybeStartTyping in BlockListBlock
const stopKeyPropagation = ( event ) => event.stopPropagation();

class FormatToolbar extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			settingsVisible: false,
			opensInNewWindow: false,
			linkValue: '',
		};

		this.addLink = this.addLink.bind( this );
		this.editLink = this.editLink.bind( this );
		this.dropLink = this.dropLink.bind( this );
		this.submitLink = this.submitLink.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.onChangeLinkValue = this.onChangeLinkValue.bind( this );
		this.toggleLinkSettingsVisibility = this.toggleLinkSettingsVisibility.bind( this );
		this.setLinkTarget = this.setLinkTarget.bind( this );
	}

	onKeyDown( event ) {
		if ( event.keyCode === ESCAPE ) {
			const link = this.props.formats.link;
			const isAddingLink = link && link.isAdding;
			if ( isAddingLink ) {
				event.stopPropagation();
				if ( ! link.value ) {
					this.dropLink();
				} else {
					this.props.onChange( { link: { ...link, isAdding: false } } );
				}
			}
		}
		if ( [ LEFT, DOWN, RIGHT, UP, BACKSPACE, ENTER ].indexOf( event.keyCode ) > -1 ) {
			stopKeyPropagation( event );
		}
	}

	componentWillReceiveProps( nextProps ) {
		if ( this.props.selectedNodeId !== nextProps.selectedNodeId ) {
			this.setState( {
				settingsVisible: false,
				opensInNewWindow: !! nextProps.formats.link && !! nextProps.formats.link.target,
				linkValue: '',
			} );
		}
	}

	onChangeLinkValue( value ) {
		this.setState( { linkValue: value } );
	}

	toggleFormat( format ) {
		return () => {
			this.props.onChange( {
				[ format ]: ! this.props.formats[ format ],
			} );
		};
	}

	toggleLinkSettingsVisibility() {
		this.setState( ( state ) => ( { settingsVisible: ! state.settingsVisible } ) );
	}

	setLinkTarget( opensInNewWindow ) {
		this.setState( { opensInNewWindow } );
		if ( this.props.formats.link ) {
			this.props.onChange( { link: {
				value: this.props.formats.link.value,
				target: opensInNewWindow ? '_blank' : null,
				rel: opensInNewWindow ? 'noreferrer noopener' : null,
			} } );
		}
	}

	addLink() {
		this.setState( { linkValue: '' } );
		this.props.onChange( { link: { isAdding: true } } );
	}

	dropLink() {
		this.props.onChange( { link: undefined } );
		this.setState( { linkValue: '' } );
	}

	editLink( event ) {
		event.preventDefault();
		this.props.onChange( { link: { ...this.props.formats.link, isAdding: true } } );
		this.setState( { linkValue: this.props.formats.link.value } );
	}

	submitLink( event ) {
		event.preventDefault();
		const value = prependHTTP( this.state.linkValue );
		this.props.onChange( { link: {
			isAdding: false,
			target: this.state.opensInNewWindow ? '_blank' : null,
			rel: this.state.opensInNewWindow ? 'noreferrer noopener' : null,
			value,
		} } );

		this.setState( { linkValue: value } );
		if ( ! this.props.formats.link.value ) {
			this.props.speak( __( 'Link added.' ), 'assertive' );
		}
	}

	isFormatActive( format ) {
		return this.props.formats[ format ] && this.props.formats[ format ].isActive;
	}

	render() {
		const { formats, focusPosition, enabledControls = DEFAULT_CONTROLS, customControls = [] } = this.props;
		const { linkValue, settingsVisible, opensInNewWindow } = this.state;
		const isAddingLink = formats.link && formats.link.isAdding;

		const toolbarControls = FORMATTING_CONTROLS.concat( customControls )
			.filter( ( control ) => enabledControls.indexOf( control.format ) !== -1 )
			.map( ( control ) => {
				if ( control.format === 'link' ) {
					const isFormatActive = this.isFormatActive( 'link' );
					const isActive = isFormatActive || isAddingLink;
					return {
						...control,
						icon: isFormatActive ? 'editor-unlink' : 'admin-links', // TODO: Need proper unlink icon
						title: isFormatActive ? __( 'Unlink' ) : __( 'Link' ),
						onClick: isActive ? this.dropLink : this.addLink,
						isActive,
					};
				}

				return {
					...control,
					onClick: this.toggleFormat( control.format ),
					isActive: this.isFormatActive( control.format ),
				};
			} );

		const linkSettings = settingsVisible && (
			<div className="editor-format-toolbar__link-modal-line editor-format-toolbar__link-settings">
				<ToggleControl
					label={ __( 'Open in new window' ) }
					checked={ opensInNewWindow }
					onChange={ this.setLinkTarget } />
			</div>
		);

		return (
			<div className="editor-format-toolbar">
				<Toolbar controls={ toolbarControls } />

				{ ( isAddingLink || formats.link ) && (
					<Fill name="RichText.Siblings">
						<div className="editor-format-toolbar__link-container" style={ { ...focusPosition } }>
							{ isAddingLink && (
								// Disable reason: KeyPress must be suppressed so the block doesn't hide the toolbar
								/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
								<form
									className="editor-format-toolbar__link-modal"
									onKeyPress={ stopKeyPropagation }
									onKeyDown={ this.onKeyDown }
									onSubmit={ this.submitLink }>
									<div className="editor-format-toolbar__link-modal-line">
										<UrlInput value={ linkValue } onChange={ this.onChangeLinkValue } />
										<IconButton icon="editor-break" label={ __( 'Apply' ) } type="submit" />
										<IconButton
											className="editor-format-toolbar__link-settings-toggle"
											icon="ellipsis"
											label={ __( 'Link Settings' ) }
											onClick={ this.toggleLinkSettingsVisibility }
											aria-expanded={ settingsVisible }
										/>
									</div>
									{ linkSettings }
								</form>
								/* eslint-enable jsx-a11y/no-noninteractive-element-interactions */
							) }

							{ formats.link && ! isAddingLink && (
								// Disable reason: KeyPress must be suppressed so the block doesn't hide the toolbar
								/* eslint-disable jsx-a11y/no-static-element-interactions */
								<div
									className="editor-format-toolbar__link-modal"
									onKeyPress={ stopKeyPropagation }
								>
									<div className="editor-format-toolbar__link-modal-line">
										<a
											className="editor-format-toolbar__link-value"
											href={ formats.link.value }
											target="_blank"
										>
											{ formats.link.value && filterURLForDisplay( decodeURI( formats.link.value ) ) }
										</a>
										<IconButton icon="edit" label={ __( 'Edit' ) } onClick={ this.editLink } />
										<IconButton
											className="editor-format-toolbar__link-settings-toggle"
											icon="ellipsis"
											label={ __( 'Link Settings' ) }
											onClick={ this.toggleLinkSettingsVisibility }
											aria-expanded={ settingsVisible }
										/>
									</div>
									{ linkSettings }
								</div>
								/* eslint-enable jsx-a11y/no-static-element-interactions */
							) }
						</div>
					</Fill>
				) }
			</div>
		);
	}
}

export default withSpokenMessages( FormatToolbar );
