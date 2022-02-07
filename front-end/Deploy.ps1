npm run build

Connect-AzAccount

$resourceGroup = "multifactiondao"
$storageAccountName = 'multifactiondao'

$storageAccount = Get-AzStorageAccount -ResourceGroupName $resourceGroup -Name $storageAccountName
$ctx = $storageAccount.Context

$sasToken = New-AzStorageContainerSASToken -Name '$web' -Permission rwdl -Context $ctx
azcopy copy '.\build\*' ('https://'+$storageAccountName+'.blob.core.windows.net/$web'+$sasToken) --recursive 