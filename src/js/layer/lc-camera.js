platformer.components['lc-camera'] = (function(){
	var component = function(owner, definition){
		this.owner = owner;
		this.entities = [];
		
		// Messages that this component listens for
		this.listeners = [];
		
		this.tickMessages = ['camera'];
		this.addListeners(['resize', 'camera', 'load', 'world-loaded']);  
		
		//The dimensions of the camera in the window
		this.portalTop = this.owner.rootElement.innerTop;
		this.portalLeft = this.owner.rootElement.innerLeft;
		this.portalWidth = this.owner.rootElement.offsetWidth;
		this.portalHeight = this.owner.rootElement.offsetHeight;
		
		//The dimensions of the camera in the game world
		this.width       = definition.width       || 0; 
		this.height      = definition.height      || 0;
		this.aspectRatio = definition.aspectRatio || 0;
		this.left        = definition.left        || 0;
		this.top         = definition.top         || 0;
		
		if(this.width && this.height){
			this.aspectRatio = this.aspectRatio || (this.height      / this.width); 
		} else {
			this.aspectRatio = this.aspectRatio || (this.portalHeight / this.portalWidth);
			if (this.width || this.height){
				this.width       = this.width       || (this.height      / this.aspectRatio); 
				this.height      = this.height      || (this.aspectRatio / this.width); 
			} else {
				this.width       = this.portalWidth;
				this.height      = this.aspectRatio * this.width;
			}
		}
		
		// The dimensions of the entire world
		this.worldWidth  = 0; //definition.worldWidth;
		this.worldHeight = 0; //definition.worldHeight;
		
		this.worldPerScreenUnitWidth = this.width / this.portalWidth;
		this.worldPerScreenUnitHeight = this.height / this.portalHeight;
		
		this.screenPerWorldUnitWidth =  this.portalWidth / this.width;
		this.screenPerWorldUnitHeight =  this.portalHeight/ this.height;
		
		this.following = undefined;
		this.state = 'static';//'roaming';
		
		//FOLLOW MODE VARIABLES
		
		//--Bounding
		this.boundingBoxLeft = 100;
		this.boundingBoxTop = 100;
		this.boundingBoxWidth = this.width - (2 * this.boundingBoxLeft);
		this.boundingBoxHeight = this.height - (2 * this.boundingBoxTop);
		
		
		this.direction = true;  
	};
	var proto = component.prototype; 

	proto['load'] = function(){
	};

	proto['world-loaded'] = function(values){
		this.worldWidth   = this.owner.worldWidth  = values.width;
		this.worldHeight  = this.owner.worldHeight = values.height;
		if(values.camera){
			this.follow(values.camera);
		}
	};
	
	proto['camera'] = function(deltaT){
		
		switch (this.state)
		{
		case 'following':
			this.followingFunction(this.following);
			break;
		case 'roaming':
			var speed = .3 * deltaT;
			if (this.direction)
			{
				this.move(this.left + speed, this.top);
				if (this.worldWidth && (this.left == this.worldWidth - this.width)) {
					this.direction = !this.direction;
				}
			} else {
				this.move(this.left - speed, this.top);
				if (this.worldWidth && (this.left == 0)) {
					this.direction = !this.direction;
				}
			}
			break;
		case 'static':
		default:
			break;
		}
		this.owner.trigger('camera-update', {x: this.left, y: this.top});
	};
	
	proto['resize'] = function ()
	{
		//TODO: need to call this on screen resize!!
		this.portalTop = rootElement.innerTop;
		this.portalLeft = rootElement.innerLeft;
		this.portalWidth = rootElement.offsetWidth;
		this.portalHeight = rootElement.offsetHeight;
		
		this.worldPerScreenUnitWidth = this.width / this.portalWidth;
		this.worldPerScreenUnitHeight = this.height / this.portalHeight;
		
		this.screenPerWorldUnitWidth =  this.portalWidth / this.width;
		this.screenPerWorldUnitHeight =  this.portalHeight/ this.height;
	};
	
	proto['follow'] = function (def)
	{
		switch (def.mode)
		{
		case 'locked':
			this.state = 'following';
			this.following = def.entity;
			this.followingFunction = this.lockedFollow;
			break;
		case 'bounding':
			this.state = 'following';
			this.following = def.entity;
			this.setBoundingArea(def.top, def.left, def.width, def.height);
			this.followingFunction = this.boundingFollow;
			break;
		case 'custom':
			this.state = 'following';
			this.following = def.entity;
			this.followingFunction = def.followingFunction;
			break;
		case 'static':
		default:
			this.state = 'static';
			this.following = undefined;
			this.followingFunction = undefined;
			break;
		}
		
	};
	
	proto.move = function (newleft, newtop)
	{
		if (this.worldWidth && (newleft + this.width > this.worldWidth)) {
			this.left = this.worldWidth - this.width;
		} else if (this.worldWidth && (newleft < 0)) {
			this.left = 0; 
		} else {
			this.left = newleft;
		}
		
		if (this.worldHeight && (newtop + this.height > this.worldHeight)) {
			this.top = this.worldHeight - this.height;
		} else if (this.worldHeight && (newtop < 0)) {
			this.top = 0; 
		} else {
			this.top = newtop;
		}
		
	};
	
	proto.lockedFollow = function (entity)
	{
		this.move(entity.x - (this.width / 2), entity.y - (this.height / 2));
	};
	
	proto.setBoundingArea = function (top, left, width, height)
	{
		this.boundingBoxTop = top || 100;
		this.boundingBoxLeft = left || 100;
		this.boundingBoxWidth = width || this.width - (2 * this.boundingBoxLeft);
		this.boundingBoxHeight = height || this.height - (2 * this.boundingBoxTop);
	};
	
	proto.boundingFollow = function (entity)
	{
		var newLeft = 0;
		var newTop = 0;
		
		if (entity.x > this.x + this.boundingBoxLeft + this.BoundingBoxWidth) 
		{
			newLeft = entity.x -(this.boundingBoxLeft + this.BoundingBoxWidth);
		} else if (entity.x < this.x + this.boundingBoxLeft) {
			newLeft = entity.x - this.boundingBoxLeft;
		}
		
		if (entity.y > this.y + this.boundingBoxTop + this.BoundingBoxHeight) 
		{
			newTop = entity.y - this.boundingBoxTop + this.BoundingBoxHeight;
		} else if (entity.y < this.y + this.boundingBoxTop) {
			newTop = entity.y - this.boundingBoxTop;
		}
		
		this.move(newLeft, newTop);
	};
	
	/*
	proto.transition = function (coords, type, def)
	{
		this.state = 'transitioning';
		switch (type)
		{
		case 'linear':
			if (def.entity)
			{
				this.transitionEntity = def.entity;
			} else {
				this.transitionX = def.x;
				this.transitionY = def.y;
			}
			this.transitionFunction = this.linearTransition;
			break;
		case 'custom':
			this.transitionFunction = def.transitionFunction;
			break;
		case 'instant':
		default:
			this.move(coords.x - (this.width / 2), coords.y - (this.height / 2));
			break;
		
		
		}
		
	};
	
	proto.linearTransition = function ()
	{
		
		
	};
	*/
	
	proto.screenToWorld = function (sCoords)
	{
		var wCoords = [];
		wCoords[0] = Math.round((sCoords[0] - this.portalLeft) * this.worldPerScreenUnitWidth);
		wCoords[1] = Math.round((sCoords[1] - this.portalTop)  * this.worldPerScreenUnitHeight);
		return wCoords; 
	};
	
	proto.worldToScreen = function (wCoords)
	{
		var sCoords = [];
		sCoords[0] = Math.round((wCoords[0] * this.screenPerWorldUnitWidth) + this.portalLeft);
		sCoords[1] = Math.round((wCoords[1] * this.screenPerWorldUnitHeight) + this.portalTop);
		return sCoords;
	};
	
	// This function should never be called by the component itself. Call this.owner.removeComponent(this) instead.
	proto.destroy = function(){
		this.removeListeners(this.listeners);
		this.entities.length = 0;
	};
	
	/*********************************************************************************************************
	 * The stuff below here will stay the same for all components. It's BORING!
	 *********************************************************************************************************/
	
	proto.addListeners = function(messageIds){
		for(var message in messageIds) this.addListener(messageIds[message]);
	};

	proto.removeListeners = function(listeners){
		for(var messageId in listeners) this.removeListener(messageId, listeners[messageId]);
	};
	
	proto.addListener = function(messageId, callback){
		var self = this,
		func = callback || function(value){
			self[messageId](value);
		};
		this.owner.bind(messageId, func);
		this.listeners[messageId] = func;
	};

	proto.removeListener = function(boundMessageId, callback){
		this.owner.unbind(boundMessageId, callback);
	};
	
	return component;
})();
