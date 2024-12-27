import { BACKEND_API_URL } from './constants/backend';
import { INVENTORY_TYPES, LOAD_MORE_ADS_COUNT } from './constants/common';
import giftSvg from './assets/gift.svg';
import backendService from './services/backend/backend.service';

class BEC {
    constructor() {
        this.inventoryBanners = [];
        this.isVisibleOfferWallet = false;
        this.isVisibleOfferWalletChallenge = false;
        
        this.walletAddress  = '';
        this.telegramUserId = '';
        this.impressionId = '';
        this.sessionId = '';
        this.sdkAppUrl = '';

        this.offerWallStyle = {};
        this.bannerStyle = {};
        this.adsBlacklist = [];
        // infinite scroll - start
        this.adsListShow = [] // unique list
        this.isFetchingAds = false;
        this.hasMoreAds = true;
        this.inventoryCurrent = null; 
        this.noDataCount = 0;
        // infinite scroll - end
        this.container = document.createElement('div');
        this.container.className = 'becComponent';
        document.body.appendChild(this.container); // create for offerwall
        this.initialize();
    }
    configureOfferWallStyle(styleConfig) {
        this.offerWallStyle = styleConfig || {};
        this.render();
    }
    configureBannerStyle(styleConfig) {
        this.bannerStyle = styleConfig || {};
        this.render();
    }
    setBlacklistAds(adsBlacklist) {
        this.adsBlacklist = adsBlacklist || [];
        this.render(); // render again for filter 
    }
    onLoaded() {
        const event = new CustomEvent('becLoaded', { detail: 'onLoaded' });
        document.dispatchEvent(event);
    }

    encodeURL(url) {
        return encodeURIComponent(url);
    }
    mapAdsList(adsList){
        let rs = adsList.map((ad) => {
            const lang = navigator.language || (navigator.languages && navigator.languages[0]);
            const url = ad.url || `https://dmtp.tech`;
            const urlEncode = this.encodeURL(url);
            const bannerLink = `${BACKEND_API_URL}/banners/click?id=${ad.id}&inventory_id=${this.inventoryCurrent?.id}&wa=${this.walletAddress}&url=${urlEncode}&lang=${lang}&session_id=${this.sessionId}&tui=${this.telegramUserId || ''}${this.impressionId ? `&impression_id=${this.impressionId}` : ''}`;
            const adImageUrl = ad.image_url || `https://tma-demo.dmtp.tech/sdk/te.png`;
            return {
                ...ad,
                description: ad.description,
                bannerLink,
                adImageUrl,
                reward_info: this.inventoryCurrent?.inventory_type === INVENTORY_TYPES.offerWall ? this.inventoryCurrent?.reward_info : 'Play',
                rewardDesc: ad.reward_info
            };
        });

        rs = rs.filter((ad) => ad.reward_point > 0);
        // filter blacklist ads
        rs = rs.filter((ad) => {
            return !this.adsBlacklist.some(blacklistItem => 
                blacklistItem === ad.id || blacklistItem === ad.alt
            );
        });
        return rs;
    }
    async createBanners(inventories, walletAddress, telegramUserId, impressionId, sessionId) {
        let rs = [];
        if (inventories.length > 0) {
            for (let inventory of inventories) {
                const lang = navigator.language || (navigator.languages && navigator.languages[0]);
                const rsAds = await backendService.getAds(inventory.id, telegramUserId);
                let adsList = rsAds.items || [];

                if (adsList.length === 0) {
                    const url = `https://dmtp.tech`;
                    const urlEncode = this.encodeURL(url);
                    const imageUrl = `https://tma-demo.dmtp.tech/sdk/te.png`;
                    const id = `default-ad${inventory.id}`;
                    const bannerLink = `${BACKEND_API_URL}/banners/click?id=${id}&inventory_id=${inventory.id}&wa=${walletAddress}&url=${urlEncode}&lang=${lang}&session_id=${sessionId}&tui=${telegramUserId || ''}${impressionId ? `&impression_id=${impressionId}` : ''}`;
                    const adImageUrl = imageUrl || `https://tma-demo.dmtp.tech/sdk/te.png`;

                    adsList = [{
                        id: id,
                        alt: 'default ad',
                        image_url: imageUrl,
                        url: url,
                        bannerLink,
                        adImageUrl,
                        reward_info: 'Play',
                    }];
                }
                if(adsList.length > 0) {
                    this.inventoryCurrent = inventory; // save inventory
                    adsList = this.mapAdsList(adsList);
                     // Map ads and add unique ads to the adsListShow list
                    adsList.forEach(ad => {
                        if (!this.adsListShow.some(existingAd => existingAd.id === ad.id)) {
                            this.adsListShow.push(ad); // Add to unique ads if not already present
                        }
                    });
                }
                rs.push({ ads: adsList, inventory });
            }
        }
        return rs;
    }

    async initBanners(walletAddress, telegramUserId, impressionId, sessionId) {
        
        console.log("🚀 ~ BEC ~ initBanners ~ walletAddress:", walletAddress)
        try {
            if (!walletAddress) {
                return;
            }
            this.resetInfiniteScroll();
            const inventoriesPromise = await backendService.getInventories(walletAddress);
            const inventories = inventoriesPromise?.items || [];
            const rsBanners = await this.createBanners(inventories, walletAddress, telegramUserId, impressionId, sessionId);
            this.inventoryBanners = rsBanners;
            this.render();
            return rsBanners || [];
        } catch (error) {
            console.log("🚀 ~ BEC ~ initBanners ~ error:", error)
        }
    }
     

    openLinkTelegram(link) {
        const telegram = window.Telegram;
        if (telegram && telegram.WebApp) {
            telegram.WebApp.openLink(link);
        }
    }

    async initialize() {
        try {
            await this.initData();
            this.onLoaded()
        } catch (error) {
            console.log("🚀 ~ BEC ~ initialize ~ error:", error)
        }
    }
    async initData() {
        const sessionId = sessionStorage.getItem("dmtp_session_id");
        const impressionId = sessionStorage.getItem("dmtp_impression_id");
        let walletAddress = sessionStorage.getItem("dmtp_wallet_address");
        const telegramUserId = sessionStorage.getItem("dmtp_telegram_user_id");
        const sdkAppUrl = sessionStorage.getItem("dmtp_sdk_app_url");
        this.walletAddress = walletAddress;
        this.telegramUserId = telegramUserId;
        this.impressionId = impressionId;
        this.sessionId = sessionId;
        this.sdkAppUrl = sdkAppUrl;

        await this.initBanners(walletAddress, telegramUserId, impressionId, sessionId);
    }
    onClickAdEvent(ad) {
        const event = new CustomEvent('TEAdClicked', { detail: ad });
        document.dispatchEvent(event);
    }
    truncateStringToRowsWithFont(
        input,
        n,
        rowWidth,
        fontFamily = "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif",
        fontSize = 16,
        fontWeight = "normal"
    ) {
        if (n <= 0 || rowWidth <= 0) {
            throw new Error("Invalid number of rows or rowWidth.");
        }

        // Create a canvas context for measuring text
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        // Set the font property
        const font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        context.font = font;

        // Calculate width of "... more"
        const moreText = "... more";
        const moreWidth = context.measureText(moreText).width;

        // For single line truncation
        if (n === 1) {
            // If text fits completely, return it
            if (context.measureText(input).width <= rowWidth) {
                return input;
            }

            // Binary search to find maximum text that fits with "... more"
            let low = 0;
            let high = input.length;
            let best = "";

            while (low <= high) {
                const mid = Math.floor((low + high) / 2);
                const testText = input.slice(0, mid);
                const testWidth = context.measureText(testText).width + moreWidth;

                if (testWidth <= rowWidth) {
                    best = testText;
                    low = mid + 1;
                } else {
                    high = mid - 1;
                }
            }

            // Find last space to avoid cutting words
            const lastSpaceIndex = best.lastIndexOf(" ");
            if (lastSpaceIndex !== -1) {
                best = best.substring(0, lastSpaceIndex);
            }

            return best + moreText;
        }

        // For multi-line truncation (n=2)
        // If text fits completely, return it
        const tempDiv = document.createElement('div');
        tempDiv.style.cssText = `
            position: absolute;
            visibility: hidden;
            width: ${rowWidth}px;
            font-size: ${fontSize}px;
            line-height: 1.2em;
            word-break: break-word;
        `;
        tempDiv.textContent = input;
        document.body.appendChild(tempDiv);

        const lineHeight = fontSize * 1.2; // 1.2em line height
        const maxHeight = n * lineHeight;

        if (tempDiv.offsetHeight <= maxHeight) {
            document.body.removeChild(tempDiv);
            return input;
        }

        // Binary search to find maximum text that fits in n lines
        let low = 0;
        let high = input.length;
        let best = "";

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const testText = input.slice(0, mid);
            tempDiv.textContent = testText + moreText;

            if (tempDiv.offsetHeight <= maxHeight) {
                best = testText;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        document.body.removeChild(tempDiv);

        // Find last space to avoid cutting words
        const lastSpaceIndex = best.lastIndexOf(" ");
        if (lastSpaceIndex !== -1) {
            best = best.substring(0, lastSpaceIndex);
        }

        return best + moreText;
    }

    renderAds(ads, configStyle) {
        return ads.map(ad => {
            const adContainer = document.createElement('div');
            adContainer.className = 'banner-container';
            adContainer.style.backgroundColor = configStyle?.content?.backgroundColor || '#fff';
            adContainer.setAttribute('key', ad.id);
            adContainer.style.cursor = 'pointer';

            adContainer.addEventListener('click', (event) => {
                if(this.isFetchingAds === false) {
                    // Hide tooltip if it's visible
                    if (this.tooltip && this.tooltip.style.display !== 'none') {
                        this.tooltip.style.display = 'none';
                    }
                    this.showAdDetail(ad);
                }
            });

            const linkElement = this.telegramUserId
                ? document.createElement('div')
                : document.createElement('div');
            linkElement.className = 'banner-link';

            const imgElement = document.createElement('img');
            imgElement.className = 'banner-image';
            imgElement.src = ad.adImageUrl;
            imgElement.alt = ad.alt;

            const contentRight = document.createElement('div');
            contentRight.className = 'banner-content-right';
            contentRight.style.height = '96px'; // Fixed height
            contentRight.style.display = 'flex';
            contentRight.style.flexDirection = 'column';
            contentRight.style.justifyContent = 'space-between';

            const content = document.createElement('div');
            content.className = 'banner-content';
            content.style.minHeight = '60px'; // Ensure space for 2 lines of text


            // Apply custom styles to content 
            const title = document.createElement('div');
            title.className = 'banner-link-title';
            title.style.lineHeight = '1em';
            title.style.color = configStyle?.content?.appNameColor;
            title.textContent = ad.alt

            const description = document.createElement('div');
            description.className = 'banner-link-description';
            description.style.lineHeight = '1.2em';
            description.style.color = configStyle?.content?.appDescriptionColor;
            description.textContent = ad.description
           
            // Create wrapper for description and more link
            const descriptionWrapper = document.createElement('div');
            descriptionWrapper.style.position = 'relative';
            descriptionWrapper.appendChild(description);

            content.appendChild(title);
            content.appendChild(descriptionWrapper);
            contentRight.appendChild(content);

            // Apply custom styles to button 
            const rewardInfo = document.createElement('div');
            rewardInfo.className = 'banner-link-btn';
            rewardInfo.textContent = ad.reward_info;
            rewardInfo.style.backgroundColor = configStyle?.button?.backgroundColor;
            rewardInfo.style.color = configStyle?.button?.textColor;
            rewardInfo.style.marginTop = 'auto'; // Push button to bottom

            if (configStyle?.button?.backgroundColor) {
                rewardInfo.style.background = "none";
                rewardInfo.style.border = "none";
                rewardInfo.style.backgroundColor = configStyle?.button?.backgroundColor
            }
            rewardInfo.onmouseover = () => {
                rewardInfo.style.backgroundColor = configStyle?.button?.highlightedBackgroundColor || '#000';
                rewardInfo.style.color = configStyle?.button?.highlightedTextColor;
            };
            rewardInfo.onmouseout = () => {
                rewardInfo.style.backgroundColor = configStyle?.button?.backgroundColor || null;
                rewardInfo.style.color = configStyle?.button?.textColor;
            };
            
            // Add click event for rewardInfo
            rewardInfo.addEventListener('click', (event) => {
                event.stopPropagation();
                if (this.telegramUserId) {
                    this.openLinkTelegram(ad.bannerLink);
                } else {
                    window.open(ad.bannerLink, "_blank");
                }
                this.onClickAdEvent(ad);
            });

            contentRight.appendChild(rewardInfo);
            linkElement.appendChild(imgElement);
            linkElement.appendChild(contentRight);
            adContainer.appendChild(linkElement);

            // Create a MutationObserver to watch for when the element is added to DOM
            const observer = new MutationObserver((mutations, obs) => {
                if (contentRight.offsetWidth) {
                    obs.disconnect(); // Stop observing
                    console.log("🚀 ~ BEC ~ renderAds ~ contentRight:", contentRight.offsetWidth);
                    // recalculate to truncate title and description
                    const removeWidth = 60;
                    let containerWidth = contentRight.offsetWidth - removeWidth;
                    title.textContent = this.truncateStringToRowsWithFont(ad.alt, 1, containerWidth, null, 16, 'bold');
                    console.log("🚀 ~ BEC ~ renderAds ~ containerWidth:", containerWidth);
                    console.log("🚀 ~ BEC ~ renderAds ~ title.textContent:", title.textContent);
                    description.textContent = this.truncateStringToRowsWithFont(ad.description, 2, containerWidth, null, 13, 'normal');
                    console.log("🚀 ~ BEC ~ renderAds ~ description.textContent:", description.textContent);
                }
            });

            // Start observing the document with the configured parameters
            observer.observe(document.body, { childList: true, subtree: true });
            
            return adContainer;
        });
    }

    showAdDetail(ad) {
        const configStyle = this.offerWallStyle;
        // Store current scroll handler
        const adsList = document.querySelector('.ads-list');
        if (adsList) {
            // Remove scroll event listener
            adsList.removeEventListener('scroll', this.scrollHandler);
        }

        // Replace info icon with back icon in header
        const infoIcon = document.querySelector('.info-icon');
        if (infoIcon) {
            const backIcon = document.createElement('div');
            backIcon.className = 'back-icon';
            backIcon.innerHTML = `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="24" r="21" fill="#2196f3"/>
                <path d="M27 12L15 24L27 36" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
            backIcon.style.cursor = 'pointer';
            
            backIcon.onclick = () => {
                // Slide out to right
                const detailContainer = document.querySelector('.ad-detail-container');
                if (detailContainer) {
                    detailContainer.style.transform = 'translateX(100%)';
                    
                    // After animation, remove detail container and restore scroll
                    setTimeout(() => {
                        detailContainer.remove();
                        if (adsList && this.scrollHandler) {
                            adsList.addEventListener('scroll', this.scrollHandler);
                        }
                        // Restore info icon
                        backIcon.parentNode.replaceChild(infoIcon, backIcon);
                        // Show all banner containers again
                        const bannerContainers = document.querySelectorAll('.banner-container');
                        bannerContainers.forEach(container => {
                            container.style.display = '';
                        });
                    }, 300);
                }
            };

            // Replace info icon with back icon
            infoIcon.parentNode.replaceChild(backIcon, infoIcon);
        }

        const detailContainer = document.createElement('div');
        detailContainer.className = 'ad-detail-container';
        detailContainer.style.backgroundColor = '#fff';
        detailContainer.style.position = 'absolute';
        detailContainer.style.top = '0';
        detailContainer.style.left = '0';
        detailContainer.style.width = '100%';
        detailContainer.style.height = 'calc(100vh - 56px)'; // Full height minus header
        detailContainer.style.marginTop = '56px'; // Header height
        detailContainer.style.transform = 'translateX(100%)';
        detailContainer.style.transition = 'transform 0.3s ease-in-out';
        detailContainer.style.overflowY = 'auto'; // Allow scrolling if content is too long

        // Content wrapper similar to banner-container
        const contentWrapper = document.createElement('div');
        contentWrapper.style.padding = '16px';
        contentWrapper.style.minHeight = '100%';
        contentWrapper.style.backgroundColor = configStyle?.content?.backgroundColor || '#fff';
        contentWrapper.style.boxSizing = 'border-box'; // Include padding in height calculation

        // Banner link wrapper
        const bannerLink = document.createElement('div');
        bannerLink.className = 'banner-link-title';
        bannerLink.style.display = 'flex';
        bannerLink.style.alignItems = 'flex-start';
        bannerLink.style.gap = '12px';
        bannerLink.style.marginBottom = '24px';

        // App icon
        const appIcon = document.createElement('img');
        appIcon.src = ad.adImageUrl;
        appIcon.alt = ad.alt;
        appIcon.className = 'banner-image';

        // Content container
        const contentContainer = document.createElement('div');
        contentContainer.className = 'banner-content';
        contentContainer.style.display = 'flex';
        contentContainer.style.flexDirection = 'column';
        contentContainer.style.flex = '1';
        contentContainer.style.height = '90px'; // Match app icon height
        contentContainer.style.justifyContent = 'space-between';

        // App name
        const appName = document.createElement('div');
        appName.className = 'banner-title';
        appName.textContent = ad.alt;
        appName.style.color = configStyle?.content?.appNameColor;

        // Play button
        const playButton = document.createElement('button');
        playButton.textContent = ad.reward_info;
        playButton.className = 'banner-link-btn';
        playButton.style.backgroundColor = configStyle?.button?.backgroundColor;
        playButton.style.color = configStyle?.button?.textColor;

        if (configStyle?.button?.backgroundColor) {
            playButton.style.background = "none";
            playButton.style.border = "none";
            playButton.style.backgroundColor = configStyle?.button?.backgroundColor
        }
        playButton.onmouseover = () => {
            playButton.style.backgroundColor = configStyle?.button?.highlightedBackgroundColor || '#000';
        };
        playButton.onmouseout = () => {
            playButton.style.backgroundColor = configStyle?.button?.backgroundColor;
        };

        playButton.onclick = () => {
            if (this.telegramUserId) {
                this.openLinkTelegram(ad.bannerLink);
            } else {
                window.open(ad.bannerLink, "_blank");
            }
            this.onClickAdEvent(ad);
        };

        // Assemble banner link components
        contentContainer.appendChild(appName);
        contentContainer.appendChild(playButton);
        bannerLink.appendChild(appIcon);
        bannerLink.appendChild(contentContainer);

        // App description title
        const appDescriptionTitle = document.createElement('div');
        appDescriptionTitle.style.fontSize = '18px';
        appDescriptionTitle.style.fontWeight = '600';
        appDescriptionTitle.style.marginTop = '20px';
        appDescriptionTitle.style.marginBottom = '8px';
        appDescriptionTitle.style.color = configStyle?.content?.appNameColor;
        appDescriptionTitle.textContent = 'App description';

        // App description
        const appDescription = document.createElement('div');
        appDescription.className = 'banner-description';
        appDescription.style.color = configStyle?.content?.appDescriptionColor;
        appDescription.style.lineHeight = '1.2em';
        appDescription.textContent = ad.description

        // Reward description title
        const rewardDescriptionTitle = document.createElement('div');
        rewardDescriptionTitle.style.fontSize = '18px';
        rewardDescriptionTitle.style.fontWeight = '600';
        rewardDescriptionTitle.style.marginTop = '20px';
        rewardDescriptionTitle.style.marginBottom = '8px';
        rewardDescriptionTitle.style.color = configStyle?.content?.appNameColor;
        rewardDescriptionTitle.textContent = 'Reward description';

        // Reward description
        const rewardDescription = document.createElement('div');
        rewardDescription.className = 'banner-description';
        rewardDescription.style.color = configStyle?.content?.appDescriptionColor;
        rewardDescription.style.lineHeight = '1.2em';
        rewardDescription.textContent = ad.rewardDesc

        // Assemble all components
        contentWrapper.appendChild(bannerLink);
        contentWrapper.appendChild(appDescriptionTitle);
        contentWrapper.appendChild(appDescription);
        contentWrapper.appendChild(rewardDescriptionTitle);
        contentWrapper.appendChild(rewardDescription);
        detailContainer.appendChild(contentWrapper);

        // Add detail container to ads list and trigger slide animation
        if (adsList) {
            adsList.style.position = 'relative'; // Make sure parent is relative
            adsList.appendChild(detailContainer);
            
            // Use requestAnimationFrame for smooth animation
            requestAnimationFrame(() => {
                detailContainer.style.transform = 'translateX(0)';
                
                // Hide all banner containers after slide animation
                setTimeout(() => {
                    const bannerContainers = document.querySelectorAll('.banner-container');
                    bannerContainers.forEach(container => {
                        container.style.display = 'none';
                    });
                }, 300); // Same duration as transition
            });
        }
    }
    renderOfferWall(inventory, ads, handleCloseOfferWall, isVisible) {
        if (inventory.inventory_type === INVENTORY_TYPES.offerWall) {

        const offerWall = document.createElement('div');
        offerWall.className = `banner-offer-wall ${isVisible ? 'show' : ''}`;


        const overlay = document.createElement('div');
        overlay.className = 'banner-offer-overlay';
        offerWall.appendChild(overlay);


        const offerWallContainer = document.createElement('div');
        offerWallContainer.className = 'offer-waller-container';
        if (isVisible) {
            offerWallContainer.style.opacity = '1';
            offerWallContainer.style.transform = 'scale(1)';
        } else { 
            offerWallContainer.style.opacity = '0';
            offerWallContainer.style.transform = 'scale(0.8)'; 
        }
        offerWallContainer.id = `inventory${inventory?.id}`; 

        const adsList = document.createElement('div');
        adsList.className = 'ads-list';

        // Apply custom styles to topBar (offerHeader)
        const offerHeader = document.createElement('div');
        offerHeader.style.backgroundColor = this.offerWallStyle?.topBar?.backgroundColor || '#000';
        offerHeader.className = 'offer-header';


         // Add info icon to offer header
         const infoIcon = document.createElement('span');
         infoIcon.innerHTML = `
         <svg width="24" height="24" enable-background="new 0 0 48 48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="21" fill="#2196f3"/><g fill="#fff"><path d="m22 22h4v11h-4z"/><circle cx="24" cy="16.5" r="2.5"/></g></svg>
         `; // Using an info emoji as the icon
         infoIcon.classList.add('info-icon');
 
         // Create tooltip element
         this.tooltip = document.createElement('div');
         this.tooltip.classList.add('tooltip-info');
         this.tooltip.innerHTML = `
         <div style="color: #fff; font-size: 14px; font-weight: bold; text-align: left; margin-bottom: 8px"> A Free Decentralized Audience Growth Engine </div>
         <div style="color: #fff; font-size: 12px; text-align: left">At no cost, Web3 Traffic Exchange is a decentralized platform where projects get and spend tokens to exchange user traffic. Developers showcase their games to acquire tokens, then use these tokens to promote their own projects across the network. This fosters mutual growth in the Web3 ecosystem, allowing developers to increase their user base. </div>
         ${this.sdkAppUrl ? `<div style="margin-top: 10px;text-align: left;"><a href="${this.sdkAppUrl}" target="_blank" style="color: rgb(52, 152, 219); text-decoration: none">${this.sdkAppUrl}</a></div>` : ''}
         `;
         this.tooltip.style.display = 'none'; // Initially hidden
 
         // Append icon and tooltip to the header
         offerHeader.appendChild(infoIcon);
         offerHeader.appendChild(this.tooltip);
 
         // Add click event to show/hide tooltip
         infoIcon.addEventListener('click', () => {
             this.tooltip.style.display = this.tooltip.style.display === 'none' ? 'block' : 'none';
         });

        // add header title
        const headerTitle = document.createElement('div');
        headerTitle.className = 'header-title';
        headerTitle.textContent = 'Apps Network';
        headerTitle.style.color = this.offerWallStyle?.topBar?.textColor || '#fff';
        offerHeader.appendChild(headerTitle);

       

        const closeButton = document.createElement('button');
        closeButton.className = 'close-button';
        closeButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M17.9999 5.99997C17.8124 5.8125 17.5581 5.70718 17.2929 5.70718C17.0278 5.70718 16.7735 5.8125 16.5859 5.99997L11.9999 10.586L7.41394 5.99997C7.22641 5.8125 6.9721 5.70718 6.70694 5.70718C6.44178 5.70718 6.18747 5.8125 5.99994 5.99997C5.81247 6.1875 5.70715 6.44181 5.70715 6.70697C5.70715 6.97213 5.81247 7.22644 5.99994 7.41397L10.5859 12L5.99994 16.586C5.81247 16.7735 5.70715 17.0278 5.70715 17.293C5.70715 17.5581 5.81247 17.8124 5.99994 18C6.18747 18.1874 6.44178 18.2928 6.70694 18.2928C6.9721 18.2928 7.22641 18.1874 7.41394 18L11.9999 13.414L16.5859 18C16.7735 18.1874 17.0278 18.2928 17.2929 18.2928C17.5581 18.2928 17.8124 18.1874 17.9999 18C18.1874 17.8124 18.2927 17.5581 18.2927 17.293C18.2927 17.0278 18.1874 16.7735 17.9999 16.586L13.4139 12L17.9999 7.41397C18.1874 7.22644 18.2927 6.97213 18.2927 6.70697C18.2927 6.44181 18.1874 6.1875 17.9999 5.99997Z" fill="white"/>
          </svg>
        `;
        closeButton.style.color = this.offerWallStyle?.topBar?.textColor || '#fff';
        closeButton.onclick = () => handleCloseOfferWall(this); 
        offerHeader.appendChild(closeButton);
        adsList.appendChild(offerHeader);

        const adsElements = this.renderAds(ads, this.offerWallStyle);
        adsElements.forEach(adElement => adsList.appendChild(adElement));

        this.addInfiniteScroll(adsList);

        offerWallContainer.appendChild(adsList);
        offerWall.appendChild(offerWallContainer);

        return offerWall
        }
    }
    offerWall() {
      this.openOfferWall();  
    }
    openOfferWall() {
      this.isVisibleOfferWallet = true;
      this.initData(); // call API again when open offer wall
    }

    closeOfferWall(self) {
      self.isVisibleOfferWallet = false;
      self.render();
    }

    openOfferWallChallenge() {
      this.isVisibleOfferWalletChallenge = true;
      this.render();
    }

    closeOfferWallChallenge(self) {
      self.isVisibleOfferWalletChallenge = false;
      self.render();
    }
    confirmConversion = async (payload) => {
        try {
            let params = { click_id: payload?.click_id, action: payload?.action || 'PLAY', tui: payload?.tui || this.userTelegramId }; 
            let result = await backendService.confirmConversion(params);
            return result;
        } catch (error) {
            console.log(error, 'error=>confirmConversion');
            return 'Error: Something went wrong';
        }
    }
    checkUserConversion = async (payload) => {
        try {
            let walletAddress = sessionStorage.getItem("dmtp_wallet_address");
            const decodedAddress = decodeURIComponent(walletAddress);
            let params = { wa: payload?.wa || decodedAddress };
            if(payload?.offset || payload?.limit) {
                params.offset = payload?.offset;
                params.limit = payload?.limit;
            }
            if (payload?.tui || this.userTelegramId) {
                params.tui = payload?.tui || this.userTelegramId
            }
            let result = await backendService.checkUserConversion(params);
            return result;
        } catch (error) {
            console.log(error, 'error=>checkUserConversion');
            return 'Error: Something went wrong';
        }
    }
    // infinite scroll - start
    resetInfiniteScroll() {
        this.hasMoreAds = true;
        this.isFetchingAds = false;
        this.inventoryCurrent = null;
        this.noDataCount = 0;
        this.adsListShow = [];
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async fetchMoreAds() {
        if(this.noDataCount > LOAD_MORE_ADS_COUNT) {          
            this.hasMoreAds = false;
        }
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        spinner.innerHTML = `
            <img width="24" height="24" src="${giftSvg}" alt="Loading" class="loader" />
        `; // Add your loading spinner HTML here
        const adsList = document.querySelector('.ads-list');
        if (adsList) {
            adsList.appendChild(spinner); // Show spinner
        }

        try {
            if (!this.inventoryCurrent?.id) {
                console.error("Inventory ID is not set.");
                return [];
            }
            await this.sleep(1000); // to show loading
            const rsAds = await backendService.getAds(
                this.inventoryCurrent?.id,
                this.telegramUserId
            );

            let adsData = rsAds.items || [];
            adsData = this.mapAdsList(adsData);

             // Filter out duplicates using the uniqueAds list
            const uniqueAds = adsData.filter(ad => 
                !this.adsListShow.some(existingAd => existingAd.id === ad.id)
            );
            console.log("🚀 ~ BEC ~ fetchMoreAds ~ uniqueAds:", uniqueAds)
            if(uniqueAds?.length > 0) { 
                this.adsListShow.push(...uniqueAds);
                this.noDataCount = 0; // reset 
            }else{
                this.noDataCount++;
            }
            console.log("🚀 ~ BEC ~ fetchMoreAds ~  this.noDataCount:",  this.noDataCount)
            console.log("🚀 ~ BEC ~ fetchMoreAds ~ this.adsListShow:", this.adsListShow)
            return this.renderAds(uniqueAds, this.offerWallStyle);
        } catch (error) {
            console.error("Error fetching more ads:", error);
            return [];
        } finally {
            if (adsList && spinner) {
                adsList.removeChild(spinner); // Hide spinner
            }
        }
    }
    addInfiniteScroll(adsList) {
        const handleScroll = async () => {
            const scrollTop = adsList.scrollTop;
            const scrollHeight = adsList.scrollHeight;
            const clientHeight = adsList.clientHeight;
            try {
                // check if the user has scrolled to the bottom
                if (scrollTop + clientHeight >= scrollHeight - 10 && !this.isFetchingAds  && this.hasMoreAds) {
                    this.isFetchingAds = true;
                    const additionalAds = await this.fetchMoreAds(); // fetch more ads
                    if (additionalAds?.length > 0) {
                        additionalAds.forEach(adElement => adsList.appendChild(adElement));
                    }
                    this.isFetchingAds = false; // reset the flag
                }
            } catch (error) {
                console.error("Error adding infinite scroll:", error);
                this.isFetchingAds = false;
            }
        };
        this.scrollHandler = handleScroll.bind(this);
        adsList.addEventListener('scroll',  this.scrollHandler);
    }
    // infinite scroll - end
    render() {
        this.container.innerHTML = ''; // Clear previous content
        this.inventoryBanners.forEach(banner => {
            const { ads, inventory } = banner;
            const bannerWrapper = document.createElement('div');
            bannerWrapper.setAttribute('key', inventory.id);

            if (inventory.inventory_type === INVENTORY_TYPES.banner) {
                const exchangeBanner = document.getElementById('exchangeBanner');
                if (!exchangeBanner) {
                    console.warn('Element with id "exchangeBanner" not found. Skipping this item.');
                    return;
                }
        
                this.container = document.createElement('div');
                this.container.className = 'becComponent';
                exchangeBanner.appendChild(this.container);
                const inventoryContainer = document.createElement('div');
                inventoryContainer.className = 'banner-exchange-code';
                inventoryContainer.style.width = `${inventory.size_width}px`;
                inventoryContainer.style.height = `${inventory.size_height}px`;
                inventoryContainer.className = `inventory-container ${inventory.location.toLowerCase()}`;
                inventoryContainer.id = `inventory${inventory.id}`;

                const adsElements = this.renderAds(ads, this.bannerStyle);
                adsElements.forEach(adElement => inventoryContainer.appendChild(adElement));
                bannerWrapper.appendChild(inventoryContainer);
            }

            // OFFER TYPE
            if (inventory.inventory_type === INVENTORY_TYPES.offerWall) {
                const offerWallContainer = this.renderOfferWall(inventory,ads, this.closeOfferWall, this.isVisibleOfferWallet);
                bannerWrapper.appendChild(offerWallContainer);
            }

            // OFFER CHALLENGE TYPE
            if (inventory.inventory_type === INVENTORY_TYPES.offerWallChallenge) {
                const offerChallengeContainer = this.renderOfferWall(inventory,ads, this.closeOfferWallChallenge, this.isVisibleOfferWalletChallenge);
                bannerWrapper.appendChild(offerChallengeContainer);
            }

            this.container.appendChild(bannerWrapper);
        });
    }
}

export default BEC;
