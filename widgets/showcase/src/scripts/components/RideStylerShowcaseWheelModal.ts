namespace RideStylerShowcase {
    import WheelModelDescriptionModel = ridestyler.Descriptions.WheelModelDescriptionModel
    import WheelFitmentDescriptionModel = ridestyler.Descriptions.WheelFitmentDescriptionModel;
    import WheelPricingDataObject = ridestyler.DataObjects.WheelPricingDataObject;
    export class RideStylerShowcaseWheelModal extends RideStylerShowcaseProductModal {
        protected image:ResizeableResourceImage<"wheel/image">;

        private specsTable: RideStylerShowcaseTable<WheelFitmentDescriptionModel>;
        private summaryTable:RideStylerShowcaseTable<SummaryTableRow>;

        constructor(showcaseInstance:RideStylerShowcaseInstance, wheelModel:WheelModelDescriptionModel) {
            super(showcaseInstance);

            // Image
            this.image.update({
                WheelFitmentResourceType: ridestyler.DataObjects.WheelFitmentResourceType.Catalog,
                WheelModel: wheelModel.WheelModelID
            });

            // Brand
            HTMLHelper.setText(this.brandTitleElement, wheelModel.WheelBrandName);

            // Model Name
            HTMLHelper.setText(this.titleElement, wheelModel.WheelModelName);

            // Finish
            HTMLHelper.setText(this.subtitleElement, wheelModel.WheelModelFinishDescription);

            // Summary Table
            this.summaryTable = new RideStylerShowcaseTable<SummaryTableRow>(this.showcase, {
                columns: [
                    {
                        header: strings.getString('size'),
                        cell: 'size'
                    },
                    {
                        header: strings.getString('price'),
                        cell: 'price'
                    }
                ],
                startLoading: true
            });
            
            this.summaryElement.appendChild(this.summaryTable.component);

            this.buildSpecsPage();

            api.request('wheel/getfitmentdescriptions', {
                WheelModel: wheelModel.WheelModelID,
                IncludePromotions: true,
                IncludePricing: true
            }).done(response => {
                this.summaryTable.appendRows(this.buildSummaryTable(response.Fitments));
                this.specsTable.appendRows(response.Fitments);
            });
        }

        private buildSummaryTable(fitments: WheelFitmentDescriptionModel[]):SummaryTableRow[] {
            const allSizePriceCombinations:{diameter: number, width: number, price:number}[] = [];

            // Get a list of each fitment size/price combination
            for (const fitment of fitments) {
                let fitmentPrice = RideStylerShowcaseWheelModal.getFitmentRetailPriceDataObject(fitment);
                let fitmentPriceAmount = fitmentPrice ? fitmentPrice.WheelPricingAmount : undefined;
                
                allSizePriceCombinations.push({
                    diameter: fitment.DiameterMin,
                    width: fitment.WidthMin,
                    price: fitmentPriceAmount
                });
                
                allSizePriceCombinations.push({
                    diameter: fitment.DiameterMin,
                    width: fitment.WidthMax,
                    price: fitmentPriceAmount
                });
                
                allSizePriceCombinations.push({
                    diameter: fitment.DiameterMax,
                    width: fitment.WidthMin,
                    price: fitmentPriceAmount
                });
                
                allSizePriceCombinations.push({
                    diameter: fitment.DiameterMax,
                    width: fitment.WidthMax,
                    price: fitmentPriceAmount
                });
            }

            const sizePriceRanges:{
                [size:string]:PriceRange
            } = {};
            
            // Generate price ranges for each unique size description created above
            for (const sizePriceCombo of allSizePriceCombinations) {
                const {diameter, price, width} = sizePriceCombo;
                const size:string = diameter + '″ x ' + width;

                let priceRange:PriceRange;

                if (size in sizePriceRanges === false) {
                    priceRange = sizePriceRanges[size] = {
                        min: Infinity,
                        max: -Infinity
                    };
                } else {
                    priceRange = sizePriceRanges[size];
                }

                if (price) {
                    NumberHelper.extendRange(price, priceRange);
                }
            }

            // Translate sizePriceRanges into SummaryTableRows
            let summaryTableRows:SummaryTableRow[] = [];

            const priceIsUnspecified = (price:number) => {
                // Price must be a number, and not +- infinity
                return typeof price !== 'number' || isNaN(price) || price === Infinity || price === -Infinity;
            };

            for (const size in sizePriceRanges) {
                if (!sizePriceRanges.hasOwnProperty(size)) continue;

                const priceRange = sizePriceRanges[size];

                let priceString:string;

                if (priceIsUnspecified(priceRange.min) || priceIsUnspecified(priceRange.max)) {
                    priceString = strings.getString('call');
                } else {
                    if (priceRange.min === priceRange.max) priceString = strings.format().currency(priceRange.min, '$');
                    else priceString = strings.format().currency(priceRange.min, '$') + ' - ' + strings.format().currency(priceRange.max, '$');
                }

                summaryTableRows.push({
                    size: size,
                    price: priceString
                });
            }

            return summaryTableRows;
        }

        private buildSpecsPage() {
            this.specsTable = new RideStylerShowcaseTable<WheelFitmentDescriptionModel>(this.showcase, {
                columns: [
                    {
                        header: strings.getString('size'),
                        cell: RideStylerShowcaseWheelModal.getFitmentSizeDescription
                    }, 
                    {
                        header: strings.getString('offset'),
                        cell: fitment => RideStylerShowcaseTable.formatCell(fitment, 'OffsetMin', 'mm')
                    },
                    {
                        header: strings.getString('bolt-pattern'),
                        cell: 'BoltPatternDescription'
                    },
                    {
                        header: strings.getString('centerbore'),
                        cell: fitment => RideStylerShowcaseTable.formatCell(fitment, 'CenterboreMM', 'mm')
                    },
                    {
                        header: 'Price',
                        cell: RideStylerShowcaseWheelModal.getFitmentPrice
                    },
                    {
                        header: strings.getString('item-number'),
                        cell: RideStylerShowcaseWheelModal.getFitmentItemNumber
                    }
                ]
            });

            const specsContainer = HTMLHelper.createElement({
                className: 'scrollable',
                append: this.specsTable.component
            });

            this.addPage({
                container: specsContainer,
                label: strings.getString('specifications')
            });
        }

        protected createImage():ResizeableResourceImage<"wheel/image"> {
            return new ResizeableResourceImage<"wheel/image">(this.imageContainer, {
                action: "wheel/image",
                baseInstructions: {
                    PositionX: ridestyler.Requests.ImagePosition.Center,
                    PositionY: ridestyler.Requests.ImagePosition.Far,
                    IncludeShadow: true
                }
            });
        }

        private static getFitmentRetailPriceDataObject(fitment: WheelFitmentDescriptionModel):WheelPricingDataObject {
            return fitment.Pricing && fitment.Pricing['Retail'] || undefined;
        }

        private static getFitmentSizeDescription(fitment:WheelFitmentDescriptionModel):string {
            let {DiameterMin, WidthMin} = fitment;

            if (!DiameterMin || !WidthMin) return RideStylerShowcaseTable.emptyCellString;

            return `${DiameterMin}″ x ${WidthMin}`;
        }

        private static getFitmentPrice(fitment: WheelFitmentDescriptionModel):string {
            const noPriceString = strings.getString('call');
            let retailPriceDataObject:WheelPricingDataObject = RideStylerShowcaseWheelModal.getFitmentRetailPriceDataObject(fitment);
    
            if (!retailPriceDataObject) return noPriceString;
    
            let price:number = retailPriceDataObject.WheelPricingAmount;
    
            return price ? strings.format().currency(price, '$') : noPriceString;
        }

        private static getFitmentItemNumber(fitment: WheelFitmentDescriptionModel):string {
            let retailPriceDataObject:WheelPricingDataObject = RideStylerShowcaseWheelModal.getFitmentRetailPriceDataObject(fitment);

            let itemNumber:string;

            // Item number is the retail pricing item number by default
            if (retailPriceDataObject) itemNumber = retailPriceDataObject.WheelPricingItemNumber;
            // If there's no retail pricing, or the retail price doesn't have a item number use the fitment's part number
            if (!itemNumber) itemNumber = fitment.PartNumber;

            return itemNumber || RideStylerShowcaseTable.emptyCellString;
        }
    }

    interface PriceRange {
        min: number,
        max: number
    }

    interface SummaryTableRow {
        size: string;
        price: string;
    }
}