/* DISCLAIMER: Most of the code in this file was not written by me
 * Original version of the code: https://stackoverflow.com/questions/40572679/change-matching-words-in-a-webpages-text-to-buttons/40576258
 *  by stackoverflow user: https://stackoverflow.com/users/3773011/makyen
 *  
 *   The code was adapted to work with the rest of the extension
 */

(function () {
    function allowed(){
        var str = window.location.hostname;
        return !(str.includes('google') || str.includes('youtube'));

    }
    function fix(match){
        console.log(match);
        return match.substring(0,3) +  match.substring(4);
    }


    if (allowed()) {
        var match = new RegExp('\\b[A-Z][A-Z][A-Z][1-4a-d][0-9][0-9]', 'mgi');
        var maymatch = new RegExp('\\b[A-Z][A-Z][A-Z]\\s[1-4a-d][0-9][0-9]', 'mgi');

        function handleTextNode(textNode) {
            if (textNode.nodeName !== '#text'
                || textNode.parentNode.nodeName === 'SCRIPT'
                || textNode.parentNode.nodeName === 'STYLE'
            ) {

                return;
            }
            var origText = textNode.textContent;
            match.lastIndex = 0;
            maymatch.lastIndex =0;
            var newHtml  = origText.replace(maymatch, fix);
            newHtml = newHtml.replace(match,
                '<span style=" font-weight:normal;color:#000080;;border: 1px  #000080 double ;letter-spacing:1pt;' +
                'word-spacing:2pt;font-size:12px;text-align:left;font-family:arial black, sans-serif;line-height:1; " ' +
                'class="corInf $&" data-title = "$&" id = "$&">$&</span>');

            if (newHtml !== origText) {
                var newSpan = document.createElement('span');
                newSpan.innerHTML = newHtml;
                textNode.parentNode.replaceChild(newSpan, textNode);
            }
        }


        var textNodes = [];
        var nodeIter = document.createNodeIterator(document.body, NodeFilter.SHOW_TEXT);
        var currentNode;

        while (currentNode = nodeIter.nextNode()) {

            textNodes.push(currentNode);
        }
        textNodes.forEach(function (el) {
            handleTextNode(el);
        });

    }
})();


 
