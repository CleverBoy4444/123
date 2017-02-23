function csv ( args ) {
	return slice ( args ).join ( ',' );
}

function slice ( args ) {
	return Array.prototype.slice.call ( args );
}

function as ( args ) {
	return csv (
		slice ( args ).map ( function ( e ) {
			if ( Array.isArray ( e ) ) {
				return e.join ( ' as ' );
			}
			return e;
		} )
	);
}

function q () {
	var query = [];
	
	this.s = function () {
		query.push ( 'select', as ( arguments ) );
		return this;
	};
	this.c = function () {
		query.push ( 'count(' + csv ( arguments ) + ')' );
		return this;
	};
	this.u = function () {
		query.push ( 'count(distinct ' + csv ( arguments ) + ')' );
		return this;
	};
	this.f = function () {
		query.push ( 'from', as ( arguments ) );
		return this;
	};
	this.w = function () {
		query.push ( 'where', csv ( arguments ) );
		return this;
	};
	this.o = function () {
		query.push ( 'order by', csv ( arguments ) );
		return this;
	};
	this.a = function () {
		this.o ( arguments );
		query.push ( 'asc' );
		return this;
	};
	this.d = function () {
		this.o ( arguments );
		query.push ( 'desc' );
		return this;
	};
	this.l = function () {
		query.push ( 'limit', csv ( arguments ) );
		return this;
	};
	this.end = function () {
		var res = query.join ( ' ' );
		query.length = 0;
		return res;
	};
}

q.eq = function ( a, b ) {
	return a + '=' + b;
};

exports = function q () {
	var query = [];
	
	this.s = function () {
		query.push ( 'select', as ( arguments ) );
		return this;
	};
	this.c = function () {
		query.push ( 'count(' + csv ( arguments ) + ')' );
		return this;
	};
	this.u = function () {
		query.push ( 'count(distinct ' + csv ( arguments ) + ')' );
		return this;
	};
	this.f = function () {
		query.push ( 'from', as ( arguments ) );
		return this;
	};
	this.w = function () {
		query.push ( 'where', csv ( arguments ) );
		return this;
	};
	this.o = function () {
		query.push ( 'order by', csv ( arguments ) );
		return this;
	};
	this.a = function () {
		this.o ( arguments );
		query.push ( 'asc' );
		return this;
	};
	this.d = function () {
		this.o ( arguments );
		query.push ( 'desc' );
		return this;
	};
	this.l = function () {
		query.push ( 'limit', csv ( arguments ) );
		return this;
	};
	this.end = function () {
		var res = query.join ( ' ' );
		query.length = 0;
		return res;
	};
	this.eq = function ( a, b ) {
		return a + '=' + b;
	};
};