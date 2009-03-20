function trim( str, charlist ) {
	// http://kevin.vanzonneveld.net
	// +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// +   improved by: mdsjack (http://www.mdsjack.bo.it)
	// +   improved by: Alexander Ermolaev (http://snippets.dzone.com/user/AlexanderErmolaev)
	// +      input by: Erkekjetter
	// +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// +      input by: DxGx
	// +   improved by: Steven Levithan (http://blog.stevenlevithan.com)
	// +    tweaked by: Jack
	// +   bugfixed by: Onno Marsman
	// *     example 1: trim('    Kevin van Zonneveld    ');
	// *     returns 1: 'Kevin van Zonneveld'
	// *     example 2: trim('Hello World', 'Hdle');
	// *     returns 2: 'o Wor'
	// *     example 3: trim(16, 1);
	// *     returns 3: 6

	var whitespace, l = 0, i = 0;
	str += '';
	charlist += '';

	if (!charlist) {
	  whitespace = ' \n\r\t\f\x0b\xa0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000';
	} else {
	  whitespace = charlist.replace(/([\[\]\(\)\.\?\/\*\{\}\+\$\^\:])/g, '\$1');
	}

	l = str.length;
	for (i = 0; i < l; i++) {
	  if (whitespace.indexOf(str.charAt(i)) === -1) {
			str = str.substring(i);
			break;
	  }
	}

	l = str.length;
	for (i = l - 1; i >= 0; i--) {
	  if (whitespace.indexOf(str.charAt(i)) === -1) {
			str = str.substring(0, i + 1);
			break;
	  }
	}

	return whitespace.indexOf(str.charAt(0)) === -1 ? str : '';
}

function strrpos( haystack, needle, offset){
	// http://kevin.vanzonneveld.net
	// +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// +   bugfixed by: Onno Marsman
	// *     example 1: strrpos('Kevin van Zonneveld', 'e');
	// *     returns 1: 16

	var i = (haystack+'').lastIndexOf( needle, offset ); // returns -1
	return i >= 0 ? i : false;
}

function substr_count( haystack, needle, offset, length ) {
	// http://kevin.vanzonneveld.net
	// +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// +   bugfixed by: Onno Marsman
	// *     example 1: substr_count('Kevin van Zonneveld', 'e');
	// *     returns 1: 3
	// *     example 2: substr_count('Kevin van Zonneveld', 'K', 1);
	// *     returns 2: 0
	// *     example 3: substr_count('Kevin van Zonneveld', 'Z', 0, 10);
	// *     returns 3: false

	var pos = 0, cnt = 0;

	haystack += '';
	needle += '';
	if(isNaN(offset)) offset = 0;
	if(isNaN(length)) length = 0;
	offset--;

	while( (offset = haystack.indexOf(needle, offset+1)) != -1 ){
	  if(length > 0 && (offset+needle.length) > length){
			return false;
	  } else{
			cnt++;
	  }
	}

	return cnt;
}

function html_entity_decode( string ) {
	// http://kevin.vanzonneveld.net
	// +   original by: john (http://www.jd-tech.net)
	// +      input by: ger
	// +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// +    revised by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// +   bugfixed by: Onno Marsman
	// %          note: table from http://www.the-art-of-web.com/html/character-codes/
	// *     example 1: html_entity_decode('Kevin &amp; van Zonneveld');
	// *     returns 1: 'Kevin & van Zonneveld'

	var histogram = {}, histogram_r = {}, code = 0;
	var entity = chr = '';

	histogram['34'] = 'quot';
	histogram['38'] = 'amp';
	histogram['60'] = 'lt';
	histogram['62'] = 'gt';
	histogram['160'] = 'nbsp';
	histogram['161'] = 'iexcl';
	histogram['162'] = 'cent';
	histogram['163'] = 'pound';
	histogram['164'] = 'curren';
	histogram['165'] = 'yen';
	histogram['166'] = 'brvbar';
	histogram['167'] = 'sect';
	histogram['168'] = 'uml';
	histogram['169'] = 'copy';
	histogram['170'] = 'ordf';
	histogram['171'] = 'laquo';
	histogram['172'] = 'not';
	histogram['173'] = 'shy';
	histogram['174'] = 'reg';
	histogram['175'] = 'macr';
	histogram['176'] = 'deg';
	histogram['177'] = 'plusmn';
	histogram['178'] = 'sup2';
	histogram['179'] = 'sup3';
	histogram['180'] = 'acute';
	histogram['181'] = 'micro';
	histogram['182'] = 'para';
	histogram['183'] = 'middot';
	histogram['184'] = 'cedil';
	histogram['185'] = 'sup1';
	histogram['186'] = 'ordm';
	histogram['187'] = 'raquo';
	histogram['188'] = 'frac14';
	histogram['189'] = 'frac12';
	histogram['190'] = 'frac34';
	histogram['191'] = 'iquest';
	histogram['192'] = 'Agrave';
	histogram['193'] = 'Aacute';
	histogram['194'] = 'Acirc';
	histogram['195'] = 'Atilde';
	histogram['196'] = 'Auml';
	histogram['197'] = 'Aring';
	histogram['198'] = 'AElig';
	histogram['199'] = 'Ccedil';
	histogram['200'] = 'Egrave';
	histogram['201'] = 'Eacute';
	histogram['202'] = 'Ecirc';
	histogram['203'] = 'Euml';
	histogram['204'] = 'Igrave';
	histogram['205'] = 'Iacute';
	histogram['206'] = 'Icirc';
	histogram['207'] = 'Iuml';
	histogram['208'] = 'ETH';
	histogram['209'] = 'Ntilde';
	histogram['210'] = 'Ograve';
	histogram['211'] = 'Oacute';
	histogram['212'] = 'Ocirc';
	histogram['213'] = 'Otilde';
	histogram['214'] = 'Ouml';
	histogram['215'] = 'times';
	histogram['216'] = 'Oslash';
	histogram['217'] = 'Ugrave';
	histogram['218'] = 'Uacute';
	histogram['219'] = 'Ucirc';
	histogram['220'] = 'Uuml';
	histogram['221'] = 'Yacute';
	histogram['222'] = 'THORN';
	histogram['223'] = 'szlig';
	histogram['224'] = 'agrave';
	histogram['225'] = 'aacute';
	histogram['226'] = 'acirc';
	histogram['227'] = 'atilde';
	histogram['228'] = 'auml';
	histogram['229'] = 'aring';
	histogram['230'] = 'aelig';
	histogram['231'] = 'ccedil';
	histogram['232'] = 'egrave';
	histogram['233'] = 'eacute';
	histogram['234'] = 'ecirc';
	histogram['235'] = 'euml';
	histogram['236'] = 'igrave';
	histogram['237'] = 'iacute';
	histogram['238'] = 'icirc';
	histogram['239'] = 'iuml';
	histogram['240'] = 'eth';
	histogram['241'] = 'ntilde';
	histogram['242'] = 'ograve';
	histogram['243'] = 'oacute';
	histogram['244'] = 'ocirc';
	histogram['245'] = 'otilde';
	histogram['246'] = 'ouml';
	histogram['247'] = 'divide';
	histogram['248'] = 'oslash';
	histogram['249'] = 'ugrave';
	histogram['250'] = 'uacute';
	histogram['251'] = 'ucirc';
	histogram['252'] = 'uuml';
	histogram['253'] = 'yacute';
	histogram['254'] = 'thorn';
	histogram['255'] = 'yuml';

	// Reverse table. Cause for maintainability purposes, the histogram is
	// identical to the one in htmlentities.
	for (code in histogram) {
	  entity = histogram[code];
	  histogram_r[entity] = code;
	}

	return (string+'').replace(/(\&([a-zA-Z]+)\;)/g, function(full, m1, m2){
	  if (m2 in histogram_r) {
			return String.fromCharCode(histogram_r[m2]);
	  } else {
			return m2;
	  }
	});
}
