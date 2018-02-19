/**
 * External dependencies
 */
import { every, keys, isEqual, without } from 'lodash';

/**
 * Internal dependencies
 */
import { getDefaultBlockName } from './registration';
import { createBlock } from './factory';

/**
 * Determines whether the block is a default block
 * and its attributes are equal to the default attributes
 * which means the block is unmodified.
 *
 * @param  {WPBlock} block Block Object
 *
 * @return {boolean}       Whether the block is an unmodified default block
 */
export function isUnmodifiedDefaultBlock( block ) {
	const defaultBlockName = getDefaultBlockName();
	if ( block.name !== defaultBlockName ) {
		return false;
	}

	const newDefaultBlock = createBlock( defaultBlockName );
	// Omit the layout attribute because it's a special attribute used for nested blocks.
	const attributeKeys = without( [
		...keys( newDefaultBlock.attributes ),
		...keys( block.attributes ),
	], 'layout' );

	return every( attributeKeys, key =>
		isEqual( newDefaultBlock.attributes[ key ], block.attributes[ key ] )
	);
}
