/**
 *  Javascript voor het uitklappen van de inlogbalk.
 */

jQuery(document).ready(function() {
    // Standaard login form verbergen.
    // Dit via jQuery zodat formulier wel zichtbaar is wanneer javascript uitgeschakeld is.
    jQuery('#login-form').toggleClass("expanded hide");
    if(jQuery('#login-form').hasClass('hide')){
        if(jQuery(window).width()>460){
            jQuery('#login-form').css('top','-35px');
        }else{
            jQuery('#login-form').css('top','-135px');
        }
    }

    // Check voor browser resize en positie van form
    jQuery(window).resize(function(){
        if(jQuery(window).width()<460 && !jQuery('#login-form').hasClass('expanded') && jQuery('#login-form').hasClass('hide')){
            jQuery('#login-form').css('top','-135px');
        }
    });
})

function toggleLoginbalk(){

    if(jQuery(window).width()>460){
        $hide_top = "-35px";
    }else{
        $hide_top = "-135px";
    }

    $show_top = "25px";

    if(jQuery('#login-form').hasClass('expanded')){
        // Wegschuiven van loginbalk
        jQuery('#login-form').animate({top: $hide_top}, 'slow');
    }else{
        // Inschuiven van loginbalk
        jQuery('#login-form').animate({top: $show_top}, 'slow');

        // IE Fix vanwege blinkende cursus die doorheen de balk zichtbaar is
        jQuery('#login-form input[value="u"]').blur();

        setTimeout(function() {
            jQuery('.globale_menubalk_gebruikersnaam input[name="u"]').focus();
        }, 650);

    }
    jQuery('#login-form').toggleClass("hide");
    jQuery('#login-form').toggleClass("expanded");
    return false;
};
