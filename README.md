# ConsentManager

This is a simple solution for a local consent manager for Googles Tagmanager. Thanks to Andre Wyrwa, for [his very usefull example](https://theiconic.tech/load-external-js-via-custom-javascript-variables-in-google-tag-manager-ecdb99c31521), how to use custom javascript variables for Facebook Pixel in Tagmanager.

This script will do two things, it will show users a very ugly consent bar - unless you style it :) - and it save user desision to localStorage. Once the user save his settings, it wont show up again, until user delete localStorage (Chrome > Devtools > Application > Localstorage > `sw-consent-tool`).

Second job is to load single tags which you will add as custom javascript variable like descripted below. 

## Installation

### Step one

Add a custom javascript variable in Tagmanager, name it `fn.load-script` and add Wyrfels Script: https://gist.github.com/wyrfel/3852738bb8cf02063bd3354f0080054f#file-fn-load-script-js. You will need this to easy implement external ressources like Facebook Pixel.

### Step two

Add another custom javascript variable and name it `consent-tool-facebook`. Copy&Paste the following code and replace `REPLACE_WITH_YOUR_PIXEL_ID` with your Pixel id.

```js
function () {
  return function () {

    if (!window.gtm_consent_tags) {
      window.gtm_consent_tags = {}
    }

    if (!window.gtm_consent_tags.fbq) {
      window.gtm_consent_tags.fbq = function () {
        /* Facebook Pixel Code */
        !function (f, b) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; }(window, document);
        /* End Facebook Pixel Code */

        {{fn.load-script}}('//connect.facebook.net/en_US/fbevents.js');

        window.fbq('init', 'REPLACE_WITH_YOUR_PIXEL_ID');
        /* ADD ALL EVENT YOU WANT TO TRACK */
        window.fbq('track', 'PageView');

        return window.fbq;
      }
    }

    return window.gtm_consent_tags.fbq;
  }
}
```

### Step three

Now add a Tag and name it like `Load Consent Tools`, or what ever your prefered naming convention ist. Choose custom HTML tag, and enter following code:

```html
<script>
  {{consent-tool-facebook}}()
</script>
```

This will add the pixel to a global variable (window.gtm_consent_tags) in the window object.

### Step four

Add another custom HTML Tag and name it `Last Consent Tag`. This tag should be fired as last tag, because it tells the consent script that all partner tools, like Pixel, are loaded.

```html
<script>
  window.dispatchEvent(window.lastGtmTagDone);
</script>
```

### Step five

Download the [consent script](https://github.com/Sioweb/ConsentManager/blob/main/consent/consent.js) and put it into a directory, or into a subdomain like consent.yourdomain.tld. 

Include the script into the HEAD-Tag, be sure you place it as one of the first tags in HEAD-Tag. Replace `REPLACE_THIS_WITH_YOUR_TAGMANAGER_ID` with the ID of your tagmanager container.
  
```html
<head>
  <script src="//consent.yourdomain.tld/consent.js?gtm_id=REPLACE_THIS_WITH_YOUR_TAGMANAGER_ID"></script>
  <!-- rest of head -->
</head>
```

**Attention:** if you are using a subdomain, its recommendet to change the script path in the consent script: https://github.com/Sioweb/ConsentManager/blob/6642bb7ad145cbb1f726889be4a17ac00f01d061/consent/consent.js#L219 

Replace `script[src*="consent.js"]` with `script[src*="consent.yourdomain.tld/consent.js"]`. This is important to read the ID in the script-path: `?gtm_id=...`

### Step six

You can change the html template here: https://github.com/Sioweb/ConsentManager/blob/6642bb7ad145cbb1f726889be4a17ac00f01d061/consent/consent.js#L125

You rly shout do that and maybe u need to add some logic, if u want to use more then one consent option.
